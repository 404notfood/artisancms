<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\WidgetAreaRequest;
use App\Http\Requests\WidgetReorderRequest;
use App\Http\Requests\WidgetRequest;
use App\Models\Widget;
use App\Models\WidgetArea;
use App\Services\WidgetService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class WidgetController extends Controller
{
    public function __construct(
        private readonly WidgetService $widgetService,
    ) {}

    /**
     * Display all widget areas with their widgets.
     */
    public function index(): Response
    {
        $areas = $this->widgetService->getAllAreas();
        $widgetTypes = $this->widgetService->getWidgetTypes();

        return Inertia::render('Admin/Widgets/Index', [
            'areas'       => $areas,
            'widgetTypes' => $widgetTypes,
        ]);
    }

    /**
     * Create a new widget area.
     */
    public function storeArea(WidgetAreaRequest $request): RedirectResponse
    {
        $this->widgetService->createArea($request->validated());

        return redirect()
            ->route('admin.widgets.index')
            ->with('success', __('cms.widgets.area_created'));
    }

    /**
     * Update a widget area.
     */
    public function updateArea(WidgetAreaRequest $request, WidgetArea $widgetArea): RedirectResponse
    {
        $this->widgetService->updateArea($widgetArea, $request->validated());

        return redirect()
            ->back()
            ->with('success', __('cms.widgets.area_updated'));
    }

    /**
     * Delete a widget area.
     */
    public function destroyArea(WidgetArea $widgetArea): RedirectResponse
    {
        $this->widgetService->deleteArea($widgetArea);

        return redirect()
            ->route('admin.widgets.index')
            ->with('success', __('cms.widgets.area_deleted'));
    }

    /**
     * Add a widget to an area.
     */
    public function storeWidget(WidgetRequest $request, WidgetArea $widgetArea): RedirectResponse
    {
        $this->widgetService->addWidget($widgetArea, $request->validated());

        return redirect()
            ->back()
            ->with('success', __('cms.widgets.widget_added'));
    }

    /**
     * Update a widget.
     */
    public function updateWidget(WidgetRequest $request, Widget $widget): RedirectResponse
    {
        $this->widgetService->updateWidget($widget, $request->validated());

        return redirect()
            ->back()
            ->with('success', __('cms.widgets.widget_updated'));
    }

    /**
     * Remove a widget.
     */
    public function destroyWidget(Widget $widget): RedirectResponse
    {
        $this->widgetService->removeWidget($widget);

        return redirect()
            ->back()
            ->with('success', __('cms.widgets.widget_deleted'));
    }

    /**
     * Reorder widgets within an area.
     */
    public function reorderWidgets(WidgetReorderRequest $request, WidgetArea $widgetArea): RedirectResponse
    {
        $this->widgetService->reorderWidgets($widgetArea, $request->validated('ordered_ids'));

        return redirect()
            ->back()
            ->with('success', __('cms.widgets.widgets_reordered'));
    }
}
