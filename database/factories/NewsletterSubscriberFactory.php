<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\NewsletterSubscriber;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<NewsletterSubscriber>
 */
class NewsletterSubscriberFactory extends Factory
{
    protected $model = NewsletterSubscriber::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'email' => fake()->unique()->safeEmail(),
            'name' => fake()->name(),
            'status' => 'active',
            'subscribed_at' => now(),
            'unsubscribed_at' => null,
            'ip_address' => fake()->ipv4(),
        ];
    }

    /**
     * Set the subscriber as active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
            'subscribed_at' => now(),
            'unsubscribed_at' => null,
        ]);
    }

    /**
     * Set the subscriber as pending confirmation.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
            'subscribed_at' => null,
            'unsubscribed_at' => null,
        ]);
    }

    /**
     * Set the subscriber as unsubscribed.
     */
    public function unsubscribed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'unsubscribed',
            'unsubscribed_at' => now(),
        ]);
    }
}
