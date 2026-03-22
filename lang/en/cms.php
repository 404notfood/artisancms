<?php

return [
    // General
    'app_name' => 'ArtisanCMS',
    'dashboard' => 'Dashboard',
    'save' => 'Save',
    'cancel' => 'Cancel',
    'delete' => 'Delete',
    'edit' => 'Edit',
    'create' => 'Create',
    'search' => 'Search',
    'filter' => 'Filter',
    'actions' => 'Actions',
    'confirm' => 'Confirm',
    'back' => 'Back',
    'yes' => 'Yes',
    'no' => 'No',
    'loading' => 'Loading...',
    'no_results' => 'No results',

    // Auth
    'login' => 'Login',
    'logout' => 'Logout',
    'register' => 'Register',
    'email' => 'Email',
    'password' => 'Password',
    'remember_me' => 'Remember me',
    'forgot_password' => 'Forgot password?',

    // Navigation
    'nav' => [
        'dashboard' => 'Dashboard',
        'pages' => 'Pages',
        'posts' => 'Posts',
        'media' => 'Media',
        'menus' => 'Menus',
        'taxonomies' => 'Taxonomies',
        'categories' => 'Categories',
        'tags' => 'Tags',
        'plugins' => 'Plugins',
        'themes' => 'Themes',
        'settings' => 'Settings',
        'users' => 'Users',
        'activity' => 'Activity Log',
    ],

    // Pages
    'pages' => [
        'title' => 'Pages',
        'create' => 'New Page',
        'edit' => 'Edit Page',
        'delete_confirm' => 'Are you sure you want to delete this page?',
        'published' => 'Published',
        'draft' => 'Draft',
        'scheduled' => 'Scheduled',
        'trash' => 'Trash',
        'open_builder' => 'Open Page Builder',
    ],

    // Posts
    'posts' => [
        'title' => 'Posts',
        'create' => 'New Post',
        'edit' => 'Edit Post',
        'delete_confirm' => 'Are you sure you want to delete this post?',
        'published' => 'Published',
        'draft' => 'Draft',
        'scheduled' => 'Scheduled',
        'featured_image' => 'Featured Image',
        'excerpt' => 'Excerpt',
        'allow_comments' => 'Allow Comments',
    ],

    // Media
    'media' => [
        'title' => 'Media Library',
        'upload' => 'Upload',
        'drop_files' => 'Drop your files here',
        'max_size' => 'Max size: :size',
        'delete_confirm' => 'Delete this file?',
        'no_media' => 'No media',
        'alt_text' => 'Alt text',
        'caption' => 'Caption',
    ],

    // Menus
    'menus' => [
        'title' => 'Menus',
        'create' => 'New Menu',
        'created' => 'Menu created.',
        'updated' => 'Menu updated.',
        'deleted' => 'Menu deleted.',
        'add_item' => 'Add Item',
        'location' => 'Location',
        'item_label' => 'Label',
        'item_url' => 'URL',
        'item_added' => 'Item added.',
        'item_updated' => 'Item updated.',
        'item_deleted' => 'Item deleted.',
        'items_synced' => 'Menu items synced.',
        'items_reordered' => 'Order updated.',
    ],

    // Widgets
    'widgets' => [
        'types' => [
            'recent_posts' => 'Recent Posts',
            'categories' => 'Categories',
            'search' => 'Search',
            'text' => 'Text',
            'custom_html' => 'Custom HTML',
            'archives' => 'Archives',
            'tag_cloud' => 'Tag Cloud',
        ],
        'search_placeholder' => 'Search...',
        'area_created' => 'Widget area created.',
        'area_updated' => 'Widget area updated.',
        'area_deleted' => 'Widget area deleted.',
        'widget_added' => 'Widget added.',
        'widget_updated' => 'Widget updated.',
        'widget_deleted' => 'Widget deleted.',
        'widgets_reordered' => 'Widgets reordered.',
        'created' => 'Widget created.',
        'updated' => 'Widget updated.',
        'deleted' => 'Widget deleted.',
        'reordered' => 'Widgets reordered.',
    ],

    // Settings
    'settings' => [
        'title' => 'Settings',
        'general' => 'General',
        'seo' => 'SEO',
        'mail' => 'Email',
        'content' => 'Content',
        'media' => 'Media',
        'maintenance' => 'Maintenance',
        'saved' => 'Settings saved.',
        'updated' => 'Settings saved.',
        'site_name' => 'Site Name',
        'site_description' => 'Site Description',
        'site_url' => 'Site URL',
        'timezone' => 'Timezone',
        'locale' => 'Language',
    ],

    // Plugins
    'plugins' => [
        'title' => 'Plugins',
        'activate' => 'Activate',
        'deactivate' => 'Deactivate',
        'install' => 'Install',
        'uninstall' => 'Uninstall',
        'activated' => 'Plugin activated.',
        'deactivated' => 'Plugin deactivated.',
        'settings_saved' => 'Plugin settings saved.',
    ],

    // Themes
    'themes' => [
        'title'                  => 'Themes',
        'activate'               => 'Activate',
        'active'                 => 'Active',
        'customize'              => 'Customize',
        'activated'              => 'Theme activated successfully.',
        'customized'             => 'Theme customized successfully.',
        'installed'              => 'Theme installed successfully.',
        'deleted'                => 'Theme deleted.',
        'zip_open_failed'        => 'Could not open the ZIP file.',
        'manifest_missing'       => 'artisan-theme.json is missing from the ZIP.',
        'manifest_invalid_field' => 'Required field missing in manifest: :field',
        'manifest_parse_error'   => 'Error reading manifest',
        'cannot_delete_active'   => 'Cannot delete the currently active theme.',
    ],

    // Installation
    'install' => [
        'title' => 'ArtisanCMS Installation',
        'welcome' => 'Welcome to ArtisanCMS Installation',
        'step_stack' => 'Stack Selection',
        'step_language' => 'Language',
        'step_requirements' => 'Requirements',
        'step_database' => 'Database',
        'step_site' => 'Site Information',
        'step_admin' => 'Administrator Account',
        'step_install' => 'Installation',
        'next' => 'Next',
        'previous' => 'Previous',
        'installing' => 'Installing...',
        'success' => 'Installation successful!',
        'go_to_admin' => 'Go to Administration',
    ],

    // Status
    'status' => [
        'draft' => 'Draft',
        'published' => 'Published',
        'scheduled' => 'Scheduled',
        'trash' => 'Trash',
    ],

    // Errors
    'errors' => [
        'unauthorized' => 'Unauthorized action.',
        'not_found' => 'Resource not found.',
        'validation' => 'The submitted data is invalid.',
    ],

    // Roles
    'roles' => [
        'created' => 'Role created.',
        'updated' => 'Role updated.',
        'deleted' => 'Role deleted.',
        'system_cannot_delete' => 'Cannot delete a system role.',
    ],

    // Comments
    'comments' => [
        'approved' => 'Comment approved.',
        'rejected' => 'Comment rejected.',
        'spam' => 'Comment marked as spam.',
        'deleted' => 'Comment deleted.',
    ],

    // Branding
    'branding' => [
        'updated' => 'Branding updated.',
        'reset' => 'Branding reset.',
        'imported' => 'Branding configuration imported.',
        'invalid_json' => 'The JSON file is invalid.',
        'export_error' => 'Error exporting branding.',
    ],

    // Design Tokens
    'design_tokens' => [
        'created' => 'Design token created.',
        'updated' => 'Design token updated.',
        'deleted' => 'Design token deleted.',
        'seeded' => 'Default tokens generated.',
        'categories' => [
            'color' => 'Colors',
            'typography' => 'Typography',
            'button' => 'Buttons',
            'spacing' => 'Spacing',
            'shadow' => 'Shadows',
            'border' => 'Borders',
        ],
    ],

    // Webhooks
    'webhooks' => [
        'created' => 'Webhook created.',
        'updated' => 'Webhook updated.',
        'deleted' => 'Webhook deleted.',
        'tested' => 'Webhook tested successfully.',
    ],

    // Custom Fields
    'custom_fields' => [
        'created' => 'Custom field created.',
        'updated' => 'Custom field updated.',
        'deleted' => 'Custom field deleted.',
    ],

    // Popups
    'popups' => [
        'created' => 'Popup created.',
        'updated' => 'Popup updated.',
        'deleted' => 'Popup deleted.',
    ],

    // Global Sections
    'global_sections' => [
        'created' => 'Global section created.',
        'updated' => 'Global section updated.',
        'deleted' => 'Global section deleted.',
        'activated' => 'Global section activated.',
    ],

    // Newsletter
    'newsletter' => [
        'deleted' => 'Subscriber deleted.',
        'exported' => 'Subscriber list exported.',
    ],

    // Content Types
    'content_types' => [
        'created' => 'Content type created.',
        'updated' => 'Content type updated.',
        'deleted' => 'Content type deleted.',
    ],

    // Content Entries
    'content_entries' => [
        'created' => 'Content entry created.',
        'updated' => 'Content entry updated.',
        'deleted' => 'Content entry deleted.',
    ],

    // Redirects
    'redirects' => [
        'created' => 'Redirect created.',
        'updated' => 'Redirect updated.',
        'deleted' => 'Redirect deleted.',
    ],

    // Sites (Multi-site)
    'sites' => [
        'created' => 'Site created.',
        'updated' => 'Site updated.',
        'deleted' => 'Site deleted.',
        'switched' => 'Site switched successfully.',
    ],

    // Updates
    'updates' => [
        'safe_mode_enabled' => 'Safe mode enabled.',
        'safe_mode_disabled' => 'Safe mode disabled.',
        'recovery_token_generated' => 'Recovery token generated.',
    ],

    // Notifications
    'notifications' => [
        'marked_read' => 'Notification marked as read.',
        'all_marked_read' => 'All notifications marked as read.',
    ],

    // Import / Export
    'import_export' => [
        'exported' => 'Data exported successfully.',
        'imported' => 'Data imported successfully.',
    ],

    // Bulk actions
    // AI Assistant
    'ai_assistant' => [
        'settings_saved' => 'AI configuration saved.',
    ],

    // System
    'system' => [
        'session_terminated' => 'Session terminated.',
        'all_sessions_terminated' => 'All other sessions have been logged out.',
    ],

    // Account
    'account' => [
        'updated' => 'Profile updated.',
        'password_updated' => 'Password updated.',
        'avatar_updated' => 'Avatar updated.',
        'avatar_removed' => 'Avatar removed.',
    ],

    // Block patterns
    'block_patterns' => [
        'created' => 'Pattern created.',
        'updated' => 'Pattern updated.',
        'deleted' => 'Pattern deleted.',
    ],

    'bulk_action_success' => ':count items processed successfully.',
];
