<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('manuscript_submissions', function (Blueprint $table) {
            if (! Schema::hasColumn('manuscript_submissions', 'priority')) {
                $table->string('priority', 20)->default('normal')->after('status');
            }

            if (! Schema::hasColumn('manuscript_submissions', 'reviewer_name')) {
                $table->string('reviewer_name', 120)->nullable()->after('priority');
            }

            if (! Schema::hasColumn('manuscript_submissions', 'editorial_score')) {
                $table->unsignedTinyInteger('editorial_score')->nullable()->after('reviewer_name');
            }

            if (! Schema::hasColumn('manuscript_submissions', 'due_date')) {
                $table->date('due_date')->nullable()->after('editorial_score');
            }

            if (! Schema::hasColumn('manuscript_submissions', 'next_action')) {
                $table->string('next_action', 255)->nullable()->after('due_date');
            }

            if (! Schema::hasColumn('manuscript_submissions', 'decision_reason')) {
                $table->text('decision_reason')->nullable()->after('next_action');
            }

            $table->index(['priority', 'created_at']);
            $table->index(['due_date', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('manuscript_submissions', function (Blueprint $table) {
            $table->dropIndex(['priority', 'created_at']);
            $table->dropIndex(['due_date', 'status']);

            $table->dropColumn([
                'priority',
                'reviewer_name',
                'editorial_score',
                'due_date',
                'next_action',
                'decision_reason',
            ]);
        });
    }
};
