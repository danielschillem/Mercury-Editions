<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('orders')) {
            return;
        }

        Schema::table('orders', function (Blueprint $table) {
            if (! Schema::hasColumn('orders', 'shipping_address')) {
                $table->string('shipping_address', 255)->nullable();
            }

            if (! Schema::hasColumn('orders', 'shipping_city')) {
                $table->string('shipping_city', 100)->nullable();
            }

            if (! Schema::hasColumn('orders', 'shipping_country')) {
                $table->string('shipping_country', 100)->default('Burkina Faso');
            }

            if (! Schema::hasColumn('orders', 'delivery_notes')) {
                $table->text('delivery_notes')->nullable();
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('orders')) {
            return;
        }

        Schema::table('orders', function (Blueprint $table) {
            $columns = array_values(array_filter([
                Schema::hasColumn('orders', 'shipping_address') ? 'shipping_address' : null,
                Schema::hasColumn('orders', 'shipping_city') ? 'shipping_city' : null,
                Schema::hasColumn('orders', 'shipping_country') ? 'shipping_country' : null,
                Schema::hasColumn('orders', 'delivery_notes') ? 'delivery_notes' : null,
            ]));

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
