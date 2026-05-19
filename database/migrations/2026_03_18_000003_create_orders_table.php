<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 50)->unique();
            $table->string('buyer_phone', 20);
            $table->string('buyer_name')->nullable();
            $table->string('buyer_email')->nullable();
            $table->unsignedInteger('total_amount');
            $table->unsignedInteger('om_fees')->default(0);
            $table->enum('status', ['pending', 'completed', 'failed'])->default('pending');
            $table->string('om_transaction_id', 60)->nullable();
            $table->timestamps();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('book_id')->constrained();
            $table->enum('format', ['ebook', 'physical'])->default('ebook');
            $table->unsignedInteger('unit_price');
            $table->string('access_token', 64)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
