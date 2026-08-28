<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\ReadingGroup;
use App\Models\ReadingGroupMember;
use App\Models\ReadingGroupPost;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ReaderCommunityController extends Controller
{
    private const INTERESTS = ['roman', 'poesie', 'conte', 'essai', 'jeunesse', 'developpement', 'sante', 'spiritualite', 'histoire', 'societe'];

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $membershipIds = $user->readingGroupMemberships()->where('status', 'active')->pluck('reading_group_id');
        $interests = $user->reading_interests ?? [];

        $base = ReadingGroup::query()
            ->where('is_active', true)
            ->where(fn (Builder $query) => $query->where('visibility', 'public')->orWhereIn('id', $membershipIds))
            ->with(['owner:id,name,reader_alias,community_profile_visible', 'currentBook:id,title,author_name,cover_image,category'])
            ->withCount(['memberships as members_count' => fn (Builder $query) => $query->where('status', 'active')]);

        $groups = (clone $base)->orderByDesc('created_at')->get();
        $memberships = $user->readingGroupMemberships()->get()->keyBy('reading_group_id');
        $groups->each(function (ReadingGroup $group) use ($memberships): void {
            $this->maskPrivateProfile($group->owner);
            $group->setAttribute('membership', $memberships->get($group->id));
        });

        $suggested = $groups->filter(fn (ReadingGroup $group) => ! $memberships->has($group->id))
            ->sortByDesc(fn (ReadingGroup $group) => in_array($group->interest, $interests, true) ? 1 : 0)
            ->take(6)->values();

        return response()->json([
            'profile' => [
                'alias' => $user->reader_alias,
                'bio' => $user->reader_bio,
                'interests' => $interests,
                'visible' => $user->community_profile_visible,
            ],
            'available_interests' => self::INTERESTS,
            'my_groups' => $groups->filter(fn (ReadingGroup $group) => $memberships->has($group->id))->values(),
            'suggested_groups' => $suggested,
            'all_groups' => $groups,
            'stats' => [
                'groups' => $groups->count(),
                'memberships' => $memberships->where('status', 'active')->count(),
                'pending_memberships' => $memberships->where('status', 'pending')->count(),
            ],
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'alias' => ['nullable', 'string', 'min:2', 'max:60'],
            'bio' => ['nullable', 'string', 'max:600'],
            'interests' => ['required', 'array', 'max:8'],
            'interests.*' => ['string', Rule::in(self::INTERESTS)],
            'visible' => ['required', 'boolean'],
        ]);

        $request->user()->update([
            'reader_alias' => $validated['alias'] ?: null,
            'reader_bio' => $validated['bio'] ?: null,
            'reading_interests' => array_values(array_unique($validated['interests'])),
            'community_profile_visible' => $validated['visible'],
        ]);

        return response()->json(['message' => 'Profil lecteur mis à jour.']);
    }

    public function storeGroup(Request $request): JsonResponse
    {
        $validated = $this->validateGroup($request);
        if ($validated['visibility'] === 'private') $validated['membership_policy'] = 'approval';
        $group = DB::transaction(function () use ($request, $validated): ReadingGroup {
            $baseSlug = Str::slug($validated['name']);
            $slug = $baseSlug;
            for ($suffix = 2; ReadingGroup::where('slug', $slug)->exists(); $suffix++) $slug = $baseSlug . '-' . $suffix;

            $group = ReadingGroup::create([...$validated, 'owner_id' => $request->user()->id, 'slug' => $slug]);
            $group->memberships()->create([
                'user_id' => $request->user()->id,
                'role' => 'owner',
                'status' => 'active',
                'joined_at' => now(),
            ]);
            return $group;
        });

        return response()->json(['message' => 'Groupe de lecture créé.', 'group' => $group], 201);
    }

    public function show(Request $request, ReadingGroup $readingGroup): JsonResponse
    {
        $membership = $readingGroup->memberships()->where('user_id', $request->user()->id)->first();
        abort_if($readingGroup->visibility === 'private' && $membership?->status !== 'active', 403);

        $readingGroup->load(['owner:id,name,reader_alias,community_profile_visible', 'currentBook:id,title,author_name,cover_image,category']);
        $this->maskPrivateProfile($readingGroup->owner);
        $readingGroup->loadCount(['memberships as members_count' => fn (Builder $query) => $query->where('status', 'active')]);

        $members = $readingGroup->memberships()->where('status', 'active')
            ->with('user:id,name,reader_alias,reader_bio,reading_interests,community_profile_visible')
            ->orderByRaw("CASE role WHEN 'owner' THEN 1 WHEN 'moderator' THEN 2 ELSE 3 END")
            ->limit(100)->get()
            ->map(fn (ReadingGroupMember $entry) => [
                'id' => $entry->user_id,
                'name' => $entry->user->community_profile_visible
                    ? ($entry->user->reader_alias ?: $entry->user->name)
                    : 'Lecteur Mercury',
                'bio' => $entry->user->community_profile_visible ? $entry->user->reader_bio : null,
                'interests' => $entry->user->community_profile_visible ? ($entry->user->reading_interests ?? []) : [],
                'role' => $entry->role,
            ]);

        $posts = $readingGroup->posts()->with('user:id,name,reader_alias,community_profile_visible')
            ->orderByDesc('is_pinned')->latest()->limit(50)->get()->reverse()->values()
            ->map(fn (ReadingGroupPost $post) => [
                'id' => $post->id,
                'body' => $post->body,
                'is_pinned' => $post->is_pinned,
                'created_at' => $post->created_at,
                'author' => $post->user->community_profile_visible
                    ? ($post->user->reader_alias ?: $post->user->name)
                    : 'Lecteur Mercury',
                'is_mine' => $post->user_id === $request->user()->id,
            ]);

        $pendingRequests = collect();
        if ($readingGroup->owner_id === $request->user()->id) {
            $pendingRequests = $readingGroup->memberships()->where('status', 'pending')
                ->with('user:id,name,reader_alias')->oldest()->get()
                ->map(fn (ReadingGroupMember $entry) => [
                    'membership_id' => $entry->id,
                    'name' => $entry->user->reader_alias ?: $entry->user->name,
                    'created_at' => $entry->created_at,
                ]);
        }

        return response()->json(['group' => $readingGroup, 'membership' => $membership, 'members' => $members, 'posts' => $posts, 'pending_requests' => $pendingRequests]);
    }

    public function updateGroup(Request $request, ReadingGroup $readingGroup): JsonResponse
    {
        abort_unless($readingGroup->owner_id === $request->user()->id, 403);
        $validated = $this->validateGroup($request, true);
        if (($validated['visibility'] ?? null) === 'private') $validated['membership_policy'] = 'approval';
        $readingGroup->update($validated);
        return response()->json(['message' => 'Groupe mis à jour.', 'group' => $readingGroup->fresh()]);
    }

    public function join(Request $request, ReadingGroup $readingGroup): JsonResponse
    {
        abort_unless($readingGroup->is_active, 404);
        $activeCount = $readingGroup->memberships()->where('status', 'active')->count();
        if ($activeCount >= $readingGroup->member_limit) {
            throw ValidationException::withMessages(['group' => 'Ce groupe a atteint sa capacité maximale.']);
        }

        $status = $readingGroup->membership_policy === 'open' ? 'active' : 'pending';
        $membership = $readingGroup->memberships()->updateOrCreate(
            ['user_id' => $request->user()->id],
            ['role' => 'member', 'status' => $status, 'joined_at' => $status === 'active' ? now() : null]
        );
        return response()->json([
            'message' => $status === 'active' ? 'Vous avez rejoint le groupe.' : 'Votre demande a été envoyée.',
            'membership' => $membership,
        ]);
    }

    public function leave(Request $request, ReadingGroup $readingGroup): JsonResponse
    {
        abort_if($readingGroup->owner_id === $request->user()->id, 422, 'Le propriétaire ne peut pas quitter son groupe.');
        $readingGroup->memberships()->where('user_id', $request->user()->id)->delete();
        return response()->json(['message' => 'Vous avez quitté le groupe.']);
    }

    public function moderateMember(Request $request, ReadingGroup $readingGroup, ReadingGroupMember $member): JsonResponse
    {
        abort_unless($readingGroup->owner_id === $request->user()->id && $member->reading_group_id === $readingGroup->id, 403);
        $validated = $request->validate(['status' => ['required', 'in:active,rejected']]);
        if ($validated['status'] === 'rejected') $member->delete();
        else $member->update(['status' => 'active', 'joined_at' => now()]);
        return response()->json(['message' => 'Demande traitée.']);
    }

    public function storePost(Request $request, ReadingGroup $readingGroup): JsonResponse
    {
        $membership = $readingGroup->memberships()->where('user_id', $request->user()->id)->where('status', 'active')->first();
        abort_unless($membership, 403);
        $validated = $request->validate(['body' => ['required', 'string', 'min:2', 'max:2000']]);
        $post = $readingGroup->posts()->create(['user_id' => $request->user()->id, 'body' => $validated['body']]);
        return response()->json(['message' => 'Message publié.', 'post' => $post], 201);
    }

    private function validateGroup(Request $request, bool $partial = false): array
    {
        $presence = $partial ? 'sometimes' : 'required';
        return $request->validate([
            'name' => [$presence, 'string', 'min:3', 'max:100'],
            'description' => [$presence, 'string', 'min:20', 'max:1500'],
            'interest' => [$presence, Rule::in(self::INTERESTS)],
            'visibility' => [$presence, 'in:public,private'],
            'membership_policy' => [$presence, 'in:open,approval'],
            'member_limit' => [$presence, 'integer', 'min:2', 'max:500'],
            'current_book_id' => ['nullable', Rule::exists('books', 'id')->where(fn ($query) => $query->where('publication_status', 'published'))],
        ]);
    }

    private function maskPrivateProfile(?\App\Models\User $user): void
    {
        if ($user && ! $user->community_profile_visible) {
            $user->name = 'Lecteur Mercury';
            $user->reader_alias = null;
        }
    }
}
