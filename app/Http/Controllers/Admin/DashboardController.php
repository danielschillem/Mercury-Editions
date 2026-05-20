<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Author;
use App\Models\Book;
use App\Models\ManuscriptSubmission;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        // Daily revenue for the last 7 days
        $dailyRevenue = Order::where('status', 'completed')
            ->where('created_at', '>=', now()->subDays(6)->startOfDay())
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(total_amount) as revenue'), DB::raw('COUNT(*) as orders'))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Fill missing days
        $revenueByDay = [];
        for ($i = 6; $i >= 0; $i--) {
            $day = now()->subDays($i)->format('Y-m-d');
            $found = $dailyRevenue->firstWhere('date', $day);
            $revenueByDay[] = [
                'date'    => $day,
                'label'   => now()->subDays($i)->translatedFormat('D'),
                'revenue' => $found ? (int) $found->revenue : 0,
                'orders'  => $found ? (int) $found->orders : 0,
            ];
        }

        // Top 5 selling books
        $topBooks = OrderItem::select('book_id', DB::raw('COUNT(*) as sales'), DB::raw('SUM(unit_price) as revenue'))
            ->whereHas('order', fn ($q) => $q->where('status', 'completed'))
            ->groupBy('book_id')
            ->orderByDesc('sales')
            ->limit(5)
            ->with('book:id,title,author_name')
            ->get()
            ->map(fn ($item) => [
                'title'  => $item->book->title ?? 'Inconnu',
                'author' => $item->book->author_name ?? '',
                'sales'  => (int) $item->sales,
                'revenue' => (int) $item->revenue,
            ]);

        return response()->json([
            'stats' => [
                'total_books'      => Book::count(),
                'total_authors'    => Author::count(),
                'total_orders'     => Order::count(),
                'completed_orders' => Order::where('status', 'completed')->count(),
                'pending_orders'   => Order::where('status', 'pending')->count(),
                'total_revenue'    => (int) Order::where('status', 'completed')->sum('total_amount'),
                'total_manuscripts' => ManuscriptSubmission::count(),
                'new_manuscripts' => ManuscriptSubmission::where('status', 'received')->count(),
                'active_manuscripts' => ManuscriptSubmission::whereNotIn('status', ['rejected', 'published'])->count(),
            ],
            'dailyRevenue' => $revenueByDay,
            'topBooks'     => $topBooks,
            'recentOrders' => Order::with('items.book')->latest()->take(10)->get(),
            'recentManuscripts' => ManuscriptSubmission::query()
                ->latest()
                ->take(5)
                ->get(['id', 'author_name', 'email', 'title', 'collection', 'genre', 'status', 'created_at']),
        ]);
    }
}
