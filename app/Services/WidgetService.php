<?php

declare(strict_types=1);

namespace App\Services;

use App\CMS\Facades\CMS;
use App\Models\Widget;
use App\Models\WidgetArea;
use Illuminate\Support\Collection;

class WidgetService
{
    /**
     * Get all widget areas with their widgets.
     *
     * @return Collection<int, WidgetArea>
     */
    public function getAllAreas(): Collection
    {
        return WidgetArea::with(['widgets' => function ($q): void {
            $q->orderBy('order');
        }])->orderBy('name')->get();
    }

    /**
     * Find a widget area by slug with its active widgets.
     */
    public function getArea(string $slug): ?WidgetArea
    {
        return WidgetArea::withActiveWidgets()
            ->where('slug', $slug)
            ->first();
    }

    /**
     * Create a new widget area.
     *
     * @param array<string, mixed> $data
     */
    public function createArea(array $data): WidgetArea
    {
        $area = WidgetArea::create($data);

        CMS::fire('widget_area.created', $area);

        return $area;
    }

    /**
     * Update a widget area.
     *
     * @param array<string, mixed> $data
     */
    public function updateArea(WidgetArea $area, array $data): WidgetArea
    {
        $area->update($data);

        CMS::fire('widget_area.updated', $area);

        return $area->fresh() ?? $area;
    }

    /**
     * Delete a widget area and all its widgets (cascade).
     */
    public function deleteArea(WidgetArea $area): bool
    {
        CMS::fire('widget_area.deleting', $area);

        $deleted = (bool) $area->delete();

        if ($deleted) {
            CMS::fire('widget_area.deleted', $area);
        }

        return $deleted;
    }

    /**
     * Add a widget to a widget area.
     *
     * @param array<string, mixed> $data
     */
    public function addWidget(WidgetArea $area, array $data): Widget
    {
        // Set order to last position if not specified
        if (!isset($data['order'])) {
            $data['order'] = ($area->widgets()->max('order') ?? -1) + 1;
        }

        $data['widget_area_id'] = $area->id;

        $widget = Widget::create($data);

        CMS::fire('widget.created', $widget);

        return $widget;
    }

    /**
     * Update a widget.
     *
     * @param array<string, mixed> $data
     */
    public function updateWidget(Widget $widget, array $data): Widget
    {
        $widget->update($data);

        CMS::fire('widget.updated', $widget);

        return $widget->fresh() ?? $widget;
    }

    /**
     * Remove a widget.
     */
    public function removeWidget(Widget $widget): bool
    {
        CMS::fire('widget.deleting', $widget);

        $deleted = (bool) $widget->delete();

        if ($deleted) {
            CMS::fire('widget.deleted', $widget);
        }

        return $deleted;
    }

    /**
     * Reorder widgets within a widget area.
     *
     * @param array<int, int> $orderedIds Array of widget IDs in the desired order.
     */
    public function reorderWidgets(WidgetArea $area, array $orderedIds): void
    {
        foreach ($orderedIds as $index => $widgetId) {
            Widget::where('id', $widgetId)
                ->where('widget_area_id', $area->id)
                ->update(['order' => $index]);
        }

        CMS::fire('widget_area.reordered', $area);
    }

    /**
     * Get available widget types with their labels and default config.
     *
     * @return array<string, array{label: string, icon: string, defaultConfig: array<string, mixed>}>
     */
    public function getWidgetTypes(): array
    {
        $types = [
            'recent_posts' => [
                'label'         => __('cms.widgets.types.recent_posts'),
                'icon'          => 'newspaper',
                'defaultConfig' => [
                    'count' => 5,
                ],
            ],
            'categories' => [
                'label'         => __('cms.widgets.types.categories'),
                'icon'          => 'folder-tree',
                'defaultConfig' => [
                    'show_count'   => true,
                    'hierarchical' => false,
                ],
            ],
            'search' => [
                'label'         => __('cms.widgets.types.search'),
                'icon'          => 'search',
                'defaultConfig' => [
                    'placeholder' => __('cms.widgets.search_placeholder'),
                ],
            ],
            'text' => [
                'label'         => __('cms.widgets.types.text'),
                'icon'          => 'type',
                'defaultConfig' => [
                    'content' => '',
                ],
            ],
            'custom_html' => [
                'label'         => __('cms.widgets.types.custom_html'),
                'icon'          => 'code',
                'defaultConfig' => [
                    'html' => '',
                ],
            ],
            'archives' => [
                'label'         => __('cms.widgets.types.archives'),
                'icon'          => 'calendar',
                'defaultConfig' => [
                    'show_count' => true,
                    'dropdown'   => false,
                ],
            ],
            'tag_cloud' => [
                'label'         => __('cms.widgets.types.tag_cloud'),
                'icon'          => 'tags',
                'defaultConfig' => [
                    'max_tags' => 20,
                ],
            ],
        ];

        // Allow plugins to register custom widget types
        /** @var array<string, array{label: string, icon: string, defaultConfig: array<string, mixed>}> $types */
        $types = CMS::applyFilter('widget.types', $types);

        return $types;
    }
}
