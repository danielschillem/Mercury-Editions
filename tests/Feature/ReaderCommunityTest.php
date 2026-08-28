<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\ReadingGroup;
use App\Models\ReadingGroupMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReaderCommunityTest extends TestCase
{
    use RefreshDatabase;

    public function test_community_requires_authentication(): void
    {
        $this->getJson('/api/customer/community')->assertUnauthorized();
    }

    public function test_reader_can_configure_profile_and_create_group(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->putJson('/api/customer/community/profile', [
            'alias' => 'Plume du Faso',
            'bio' => 'Je lis des romans et des essais africains.',
            'interests' => ['roman', 'essai'],
            'visible' => true,
        ])->assertOk();

        $response = $this->actingAs($user)->postJson('/api/customer/community/groups', [
            'name' => 'Le cercle des romans africains',
            'description' => 'Un espace pour découvrir et discuter ensemble des romans africains.',
            'interest' => 'roman',
            'visibility' => 'public',
            'membership_policy' => 'open',
            'member_limit' => 40,
            'current_book_id' => null,
        ])->assertCreated();

        $group = ReadingGroup::where('slug', $response->json('group.slug'))->firstOrFail();
        $this->assertDatabaseHas('reading_group_members', [
            'reading_group_id' => $group->id,
            'user_id' => $user->id,
            'role' => 'owner',
            'status' => 'active',
        ]);
        $this->assertSame(['roman', 'essai'], $user->fresh()->reading_interests);
    }

    public function test_open_group_can_be_joined_and_members_can_post(): void
    {
        $owner = User::factory()->create();
        $reader = User::factory()->create();
        $group = $this->createGroup($owner, 'public', 'open');

        $this->actingAs($reader)->postJson("/api/customer/community/groups/{$group->slug}/join")
            ->assertOk()->assertJsonPath('membership.status', 'active');
        $this->actingAs($reader)->postJson("/api/customer/community/groups/{$group->slug}/posts", [
            'body' => 'Que pensez-vous du personnage principal ?',
        ])->assertCreated();

        $this->assertDatabaseHas('reading_group_posts', ['reading_group_id' => $group->id, 'user_id' => $reader->id]);
    }

    public function test_approval_group_requires_owner_validation(): void
    {
        $owner = User::factory()->create();
        $reader = User::factory()->create();
        $group = $this->createGroup($owner, 'public', 'approval');

        $this->actingAs($reader)->postJson("/api/customer/community/groups/{$group->slug}/join")
            ->assertOk()->assertJsonPath('membership.status', 'pending');
        $this->actingAs($reader)->postJson("/api/customer/community/groups/{$group->slug}/posts", ['body' => 'Bonjour au groupe'])
            ->assertForbidden();

        $membership = ReadingGroupMember::where('reading_group_id', $group->id)->where('user_id', $reader->id)->firstOrFail();
        $this->actingAs($owner)->patchJson("/api/customer/community/groups/{$group->slug}/members/{$membership->id}", ['status' => 'active'])
            ->assertOk();
        $this->assertSame('active', $membership->fresh()->status);
    }

    public function test_private_group_is_hidden_from_non_members(): void
    {
        $owner = User::factory()->create();
        $outsider = User::factory()->create();
        $group = $this->createGroup($owner, 'private', 'approval');

        $this->actingAs($outsider)->getJson('/api/customer/community')
            ->assertOk()->assertJsonMissing(['slug' => $group->slug]);
        $this->actingAs($outsider)->getJson("/api/customer/community/groups/{$group->slug}")->assertForbidden();
    }

    private function createGroup(User $owner, string $visibility, string $policy): ReadingGroup
    {
        $group = ReadingGroup::create([
            'owner_id' => $owner->id,
            'name' => 'Cercle test ' . uniqid(),
            'slug' => 'cercle-' . uniqid(),
            'description' => 'Une description suffisamment longue pour présenter ce groupe.',
            'interest' => 'roman',
            'visibility' => $visibility,
            'membership_policy' => $policy,
            'member_limit' => 50,
        ]);
        $group->memberships()->create(['user_id' => $owner->id, 'role' => 'owner', 'status' => 'active', 'joined_at' => now()]);
        return $group;
    }
}
