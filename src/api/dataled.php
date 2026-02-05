<?php
/**
 * Plugin Name: OnHub WP Sync - Integração Completa
 * Plugin URI:  https://onhub.app/plugin
 * Description: Sincroniza dados do OnHub com WordPress via REST API. Inclui todas as entidades: Folders, Files, Teams, Sessions, Chat e mais.
 * Version:     3.0.0
 * Author:      OnHub Team
 * License:     GPLv2 or later
 */

if (!defined('ABSPATH')) {
    exit;
}

class OnHubWPSync {
    const VERSION = '3.0.0';
    const OPTION_KEY = 'onhub_api_keys';
    const CONFIG_KEY = 'onhub_config';
    const REST_NAMESPACE = 'onhub/v1';
    
    // Todas as tabelas/entidades do OnHub
    const TABLES = [
        'folders' => [
            'label' => 'Pastas',
            'type' => 'onhub_folder',
            'icon' => 'dashicons-category',
            'fields' => ['name', 'parent_id', 'team_id', 'owner', 'deleted', 'color', 'icon']
        ],
        'files' => [
            'label' => 'Arquivos',
            'type' => 'onhub_file',
            'icon' => 'dashicons-media-document',
            'fields' => ['name', 'type', 'content', 'folder_id', 'team_id', 'owner', 'deleted', 'file_url']
        ],
        'teams' => [
            'label' => 'Equipes',
            'type' => 'onhub_team',
            'icon' => 'dashicons-groups',
            'fields' => ['name', 'description', 'owner', 'members', 'color', 'icon']
        ],
        'team_invitations' => [
            'label' => 'Convites de Equipe',
            'type' => 'onhub_invitation',
            'icon' => 'dashicons-email-alt',
            'fields' => ['team_id', 'email', 'status', 'invited_by', 'expires_at']
        ],
        'team_activities' => [
            'label' => 'Atividades',
            'type' => 'onhub_activity',
            'icon' => 'dashicons-clock',
            'fields' => ['team_id', 'user_email', 'action', 'entity_type', 'entity_id', 'details']
        ],
        'active_sessions' => [
            'label' => 'Sessões Ativas',
            'type' => 'onhub_session',
            'icon' => 'dashicons-visibility',
            'fields' => ['user_email', 'file_id', 'last_activity', 'cursor_position', 'is_editing']
        ],
        'chat_messages' => [
            'label' => 'Mensagens do Chat',
            'type' => 'onhub_chat',
            'icon' => 'dashicons-format-chat',
            'fields' => ['team_id', 'user_email', 'user_name', 'message', 'type', 'file_id']
        ],
        'queries' => [
            'label' => 'Consultas SQL',
            'type' => 'onhub_query',
            'icon' => 'dashicons-database',
            'fields' => ['name', 'query', 'owner', 'folder_id', 'description']
        ],
        'users' => [
            'label' => 'Usuários',
            'type' => 'users',
            'icon' => 'dashicons-admin-users',
            'fields' => ['email', 'full_name', 'profile_picture', 'role', 'auto_refresh_interval']
        ],
    ];

    public function __construct() {
        add_action('init', [$this, 'handle_preflight'], 1);
        add_action('init', [$this, 'register_all_cpts']);
        add_action('rest_api_init', [$this, 'register_routes']);
        add_action('admin_menu', [$this, 'admin_menu']);
        add_action('admin_init', [$this, 'register_settings']);
        add_filter('rest_pre_serve_request', [$this, 'allow_cors_headers'], 10, 4);

        register_activation_hook(__FILE__, [$this, 'on_activation']);
        register_deactivation_hook(__FILE__, [$this, 'on_deactivation']);
    }

    // Handle CORS preflight before WordPress processes the request
    public function handle_preflight() {
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS' && strpos($_SERVER['REQUEST_URI'], '/wp-json/onhub/') !== false) {
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, X-OnHub-Key, Authorization, X-Requested-With');
            header('Access-Control-Max-Age: 86400');
            status_header(200);
            exit;
        }
    }

    public function on_activation() {
        if (!current_user_can('activate_plugins')) return;
        if (get_option(self::OPTION_KEY) === false) {
            add_option(self::OPTION_KEY, []);
        }
        if (get_option(self::CONFIG_KEY) === false) {
            add_option(self::CONFIG_KEY, [
                'onhub_url' => '',
                'sync_enabled' => false,
                'last_sync' => null,
            ]);
        }
        $this->register_all_cpts();
        flush_rewrite_rules();
    }

    public function on_deactivation() {
        flush_rewrite_rules();
    }

    public function register_all_cpts() {
        foreach (self::TABLES as $slug => $def) {
            if ($slug === 'users') continue;

            $labels = [
                'name' => $def['label'],
                'singular_name' => $def['label'],
                'menu_name' => $def['label'],
                'add_new_item' => 'Adicionar Novo em ' . $def['label'],
                'edit_item' => 'Editar Item',
                'new_item' => 'Novo Item',
                'view_item' => 'Ver Item',
                'search_items' => 'Buscar em ' . $def['label'],
            ];

            $args = [
                'labels' => $labels,
                'public' => false,
                'show_ui' => true,
                'show_in_menu' => 'onhub-sync',
                'show_in_nav_menus' => false,
                'show_in_admin_bar' => false,
                'publicly_queryable' => false,
                'has_archive' => false,
                'exclude_from_search' => true,
                'capability_type' => 'post',
                'supports' => ['title', 'custom-fields'],
                'menu_icon' => $def['icon'] ?? 'dashicons-database',
                'show_in_rest' => false,
            ];

            register_post_type($def['type'], $args);
        }
    }

    public function admin_menu() {
        add_menu_page(
            'OnHub Sync',
            'OnHub Sync',
            'manage_options',
            'onhub-sync',
            [$this, 'admin_dashboard'],
            'dashicons-cloud-saved',
            30
        );
        
        add_submenu_page(
            'onhub-sync',
            'Dashboard',
            'Dashboard',
            'manage_options',
            'onhub-sync',
            [$this, 'admin_dashboard']
        );
        
        add_submenu_page(
            'onhub-sync',
            'Configurações',
            'Configurações',
            'manage_options',
            'onhub-settings',
            [$this, 'settings_page']
        );
        
        add_submenu_page(
            'onhub-sync',
            'API Keys',
            'API Keys',
            'manage_options',
            'onhub-api-keys',
            [$this, 'api_keys_page']
        );
        
        add_submenu_page(
            'onhub-sync',
            'Visualizar Dados',
            'Visualizar Dados',
            'manage_options',
            'onhub-data-view',
            [$this, 'data_view_page']
        );

        add_submenu_page(
            'onhub-sync',
            'Documentação API',
            'Documentação API',
            'manage_options',
            'onhub-docs',
            [$this, 'docs_page']
        );
    }

    public function register_settings() {
        register_setting('onhub_settings_group', self::OPTION_KEY);
        register_setting('onhub_settings_group', self::CONFIG_KEY);
    }

    /**
     * Dashboard Principal
     */
    public function admin_dashboard() {
        if (!current_user_can('manage_options')) return;
        
        $config = get_option(self::CONFIG_KEY, []);
        $keys = get_option(self::OPTION_KEY, []);
        
        // Contar registros
        $counts = [];
        foreach (self::TABLES as $slug => $def) {
            if ($slug === 'users') {
                $counts[$slug] = count(get_users());
            } else {
                $counts[$slug] = wp_count_posts($def['type'])->publish + wp_count_posts($def['type'])->private;
            }
        }
        
        $total_records = array_sum($counts);
        ?>
        <div class="wrap">
            <h1 style="display: flex; align-items: center; gap: 10px;">
                <span class="dashicons dashicons-cloud-saved" style="font-size: 32px; color: #2271b1;"></span>
                OnHub WP Sync - Dashboard
            </h1>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-top: 20px;">
                <!-- Status Card -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                    <h3 style="margin: 0 0 15px 0; font-size: 18px;">Status da Integração</h3>
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <span class="dashicons <?php echo !empty($config['onhub_url']) ? 'dashicons-yes-alt' : 'dashicons-warning'; ?>" style="font-size: 24px;"></span>
                        <span style="font-size: 14px;"><?php echo !empty($config['onhub_url']) ? 'Configurado' : 'Não configurado'; ?></span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span class="dashicons <?php echo count($keys) > 0 ? 'dashicons-yes-alt' : 'dashicons-warning'; ?>" style="font-size: 24px;"></span>
                        <span style="font-size: 14px;"><?php echo count($keys); ?> API Key(s) ativa(s)</span>
                    </div>
                </div>
                
                <!-- Total Records Card -->
                <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                    <h3 style="margin: 0 0 15px 0; font-size: 18px;">Total de Registros</h3>
                    <div style="font-size: 42px; font-weight: bold;"><?php echo number_format($total_records); ?></div>
                    <div style="font-size: 14px; opacity: 0.9;">em <?php echo count(self::TABLES); ?> tabelas</div>
                </div>
                
                <!-- Last Sync Card -->
                <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                    <h3 style="margin: 0 0 15px 0; font-size: 18px;">Última Sincronização</h3>
                    <div style="font-size: 16px;">
                        <?php 
                        if (!empty($config['last_sync'])) {
                            echo date('d/m/Y H:i:s', strtotime($config['last_sync']));
                        } else {
                            echo 'Nunca sincronizado';
                        }
                        ?>
                    </div>
                </div>
            </div>
            
            <!-- Tabelas Overview -->
            <h2 style="margin-top: 30px;">Visão Geral das Tabelas</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <?php foreach (self::TABLES as $slug => $def): ?>
                <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0; display: flex; align-items: center; gap: 15px;">
                    <span class="dashicons <?php echo $def['icon']; ?>" style="font-size: 28px; color: #2271b1;"></span>
                    <div>
                        <div style="font-weight: 600; color: #1d2327;"><?php echo esc_html($def['label']); ?></div>
                        <div style="font-size: 24px; font-weight: bold; color: #2271b1;"><?php echo number_format($counts[$slug]); ?></div>
                        <div style="font-size: 11px; color: #666;"><code><?php echo esc_html($slug); ?></code></div>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
            
            <!-- Quick Actions -->
            <h2 style="margin-top: 30px;">Ações Rápidas</h2>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <a href="<?php echo admin_url('admin.php?page=onhub-settings'); ?>" class="button button-primary button-hero">
                    <span class="dashicons dashicons-admin-settings" style="margin-top: 5px;"></span> Configurar Conexão
                </a>
                <a href="<?php echo admin_url('admin.php?page=onhub-api-keys'); ?>" class="button button-secondary button-hero">
                    <span class="dashicons dashicons-admin-network" style="margin-top: 5px;"></span> Gerenciar API Keys
                </a>
                <a href="<?php echo admin_url('admin.php?page=onhub-docs'); ?>" class="button button-secondary button-hero">
                    <span class="dashicons dashicons-book" style="margin-top: 5px;"></span> Ver Documentação
                </a>
            </div>
        </div>
        <?php
    }

    /**
     * Página de Configurações
     */
    public function settings_page() {
        if (!current_user_can('manage_options')) return;
        
        $config = get_option(self::CONFIG_KEY, []);
        
        if (isset($_POST['onhub_save_config']) && check_admin_referer('onhub_save_config')) {
            $config['onhub_url'] = esc_url_raw($_POST['onhub_url'] ?? '');
            $config['sync_enabled'] = isset($_POST['sync_enabled']);
            update_option(self::CONFIG_KEY, $config);
            echo '<div class="updated"><p>Configurações salvas com sucesso!</p></div>';
        }
        
        ?>
        <div class="wrap">
            <h1><span class="dashicons dashicons-admin-settings" style="margin-right: 10px;"></span>Configurações do OnHub Sync</h1>
            
            <form method="post">
                <?php wp_nonce_field('onhub_save_config'); ?>
                
                <table class="form-table">
                    <tr>
                        <th scope="row"><label for="onhub_url">URL do OnHub App</label></th>
                        <td>
                            <input type="url" id="onhub_url" name="onhub_url" 
                                   value="<?php echo esc_attr($config['onhub_url'] ?? ''); ?>" 
                                   class="regular-text" placeholder="https://seu-onhub-app.vercel.app">
                            <p class="description">URL base do seu aplicativo OnHub (onde está hospedado)</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Sincronização Automática</th>
                        <td>
                            <label>
                                <input type="checkbox" name="sync_enabled" <?php checked(!empty($config['sync_enabled'])); ?>>
                                Habilitar sincronização automática
                            </label>
                            <p class="description">Quando habilitado, os dados serão sincronizados automaticamente a cada hora</p>
                        </td>
                    </tr>
                </table>
                
                <p class="submit">
                    <input type="submit" name="onhub_save_config" class="button button-primary" value="Salvar Configurações">
                </p>
            </form>
            
            <hr>
            
            <h2>Informações da API</h2>
            <table class="widefat" style="max-width: 600px;">
                <tr>
                    <th>Base URL da API</th>
                    <td><code><?php echo esc_url(rest_url(self::REST_NAMESPACE . '/')); ?></code></td>
                </tr>
                <tr>
                    <th>Versão do Plugin</th>
                    <td><?php echo self::VERSION; ?></td>
                </tr>
                <tr>
                    <th>WordPress Version</th>
                    <td><?php echo get_bloginfo('version'); ?></td>
                </tr>
            </table>
        </div>
        <?php
    }

    /**
     * Página de API Keys
     */
    public function api_keys_page() {
        if (!current_user_can('manage_options')) return;
        
        $keys = get_option(self::OPTION_KEY, []);
        
        // Criar nova key
        if (isset($_POST['onhub_create_key']) && check_admin_referer('onhub_create_key')) {
            $label = sanitize_text_field($_POST['key_label'] ?? 'Nova Key');
            $permissions = isset($_POST['permissions']) ? array_map('sanitize_text_field', $_POST['permissions']) : ['read'];
            $new_key = 'onhub_' . bin2hex(random_bytes(24));
            
            $keys[$new_key] = [
                'label' => $label,
                'permissions' => $permissions,
                'created' => current_time('mysql'),
                'last_used' => null,
            ];
            update_option(self::OPTION_KEY, $keys);
            
            echo '<div class="notice notice-success"><p><strong>API Key criada!</strong> Copie agora, pois não será mostrada novamente:<br><code style="font-size: 14px; padding: 10px; display: block; background: #f0f0f0; margin-top: 10px;">' . esc_html($new_key) . '</code></p></div>';
        }
        
        // Revogar key
        if (isset($_GET['revoke']) && check_admin_referer('onhub_revoke_' . $_GET['revoke'])) {
            $rk = sanitize_text_field($_GET['revoke']);
            if (isset($keys[$rk])) {
                unset($keys[$rk]);
                update_option(self::OPTION_KEY, $keys);
                echo '<div class="updated"><p>API Key revogada com sucesso.</p></div>';
            }
        }
        
        ?>
        <div class="wrap">
            <h1><span class="dashicons dashicons-admin-network" style="margin-right: 10px;"></span>Gerenciar API Keys</h1>
            
            <div style="background: #fff; padding: 20px; border: 1px solid #c3c4c7; border-radius: 4px; margin: 20px 0;">
                <h2 style="margin-top: 0;">Criar Nova API Key</h2>
                <form method="post">
                    <?php wp_nonce_field('onhub_create_key'); ?>
                    
                    <table class="form-table">
                        <tr>
                            <th><label for="key_label">Nome/Rótulo</label></th>
                            <td><input type="text" id="key_label" name="key_label" class="regular-text" value="OnHub App" required></td>
                        </tr>
                        <tr>
                            <th>Permissões</th>
                            <td>
                                <label><input type="checkbox" name="permissions[]" value="read" checked> Leitura (GET)</label><br>
                                <label><input type="checkbox" name="permissions[]" value="write" checked> Escrita (POST/PUT)</label><br>
                                <label><input type="checkbox" name="permissions[]" value="delete"> Exclusão (DELETE)</label>
                            </td>
                        </tr>
                    </table>
                    
                    <p><input type="submit" name="onhub_create_key" class="button button-primary" value="Criar API Key"></p>
                </form>
            </div>
            
            <h2>API Keys Ativas</h2>
            <?php if (empty($keys)): ?>
                <p>Nenhuma API key criada ainda.</p>
            <?php else: ?>
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th style="width: 30%;">Key (parcial)</th>
                        <th>Rótulo</th>
                        <th>Permissões</th>
                        <th>Criada em</th>
                        <th>Último uso</th>
                        <th style="width: 100px;">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($keys as $key => $meta): ?>
                    <tr>
                        <td><code><?php echo esc_html(substr($key, 0, 20) . '...'); ?></code></td>
                        <td><?php echo esc_html($meta['label']); ?></td>
                        <td><?php echo esc_html(implode(', ', $meta['permissions'] ?? ['read'])); ?></td>
                        <td><?php echo esc_html($meta['created']); ?></td>
                        <td><?php echo $meta['last_used'] ? esc_html($meta['last_used']) : 'Nunca'; ?></td>
                        <td>
                            <a href="<?php echo wp_nonce_url(admin_url('admin.php?page=onhub-api-keys&revoke=' . urlencode($key)), 'onhub_revoke_' . $key); ?>" 
                               class="button button-small" 
                               onclick="return confirm('Tem certeza que deseja revogar esta API key?');">Revogar</a>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            <?php endif; ?>
        </div>
        <?php
    }

    /**
     * Página de Visualização de Dados
     */
    public function data_view_page() {
        if (!current_user_can('manage_options')) return;
        
        $current_table = sanitize_key($_GET['table'] ?? 'folders');
        if (!isset(self::TABLES[$current_table])) {
            $current_table = 'folders';
        }
        
        ?>
        <div class="wrap">
            <h1><span class="dashicons dashicons-visibility" style="margin-right: 10px;"></span>Visualizar Dados</h1>
            
            <h2 class="nav-tab-wrapper">
                <?php foreach (self::TABLES as $slug => $def): 
                    $active = $slug === $current_table ? ' nav-tab-active' : '';
                ?>
                <a href="<?php echo admin_url('admin.php?page=onhub-data-view&table=' . $slug); ?>" 
                   class="nav-tab<?php echo $active; ?>">
                    <span class="dashicons <?php echo $def['icon']; ?>" style="font-size: 16px; margin-right: 5px;"></span>
                    <?php echo esc_html($def['label']); ?>
                </a>
                <?php endforeach; ?>
            </h2>
            
            <div style="margin-top: 20px;">
                <?php 
                if ($current_table === 'users') {
                    $this->render_users_table();
                } else {
                    $this->render_cpt_table($current_table);
                }
                ?>
            </div>
        </div>
        <?php
    }

    private function render_cpt_table($table) {
        $def = self::TABLES[$table];
        $posts = get_posts([
            'post_type' => $def['type'],
            'posts_per_page' => 50,
            'post_status' => ['publish', 'private', 'draft'],
        ]);
        
        ?>
        <h3><?php echo esc_html($def['label']); ?> - <?php echo count($posts); ?> registro(s)</h3>
        
        <?php if (empty($posts)): ?>
            <p>Nenhum registro encontrado.</p>
        <?php else: ?>
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th style="width: 60px;">ID</th>
                    <th>Título</th>
                    <?php foreach (array_slice($def['fields'], 0, 4) as $field): ?>
                    <th><?php echo esc_html(ucfirst(str_replace('_', ' ', $field))); ?></th>
                    <?php endforeach; ?>
                    <th>Data</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($posts as $post): ?>
                <tr>
                    <td><?php echo $post->ID; ?></td>
                    <td><a href="<?php echo get_edit_post_link($post->ID); ?>"><?php echo esc_html($post->post_title); ?></a></td>
                    <?php foreach (array_slice($def['fields'], 0, 4) as $field): 
                        $value = get_post_meta($post->ID, $field, true);
                    ?>
                    <td>
                        <?php 
                        if (is_array($value)) {
                            echo '<code>' . esc_html(substr(json_encode($value), 0, 50)) . '...</code>';
                        } else {
                            echo esc_html(substr($value, 0, 50));
                        }
                        ?>
                    </td>
                    <?php endforeach; ?>
                    <td><?php echo get_the_date('d/m/Y H:i', $post); ?></td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
        <?php endif;
    }

    private function render_users_table() {
        $users = get_users(['number' => 50]);
        ?>
        <h3>Usuários - <?php echo count($users); ?> registro(s)</h3>
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th style="width: 60px;">ID</th>
                    <th>Login</th>
                    <th>Email</th>
                    <th>Nome</th>
                    <th>Função</th>
                    <th>Registrado em</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($users as $user): ?>
                <tr>
                    <td><?php echo $user->ID; ?></td>
                    <td><?php echo esc_html($user->user_login); ?></td>
                    <td><?php echo esc_html($user->user_email); ?></td>
                    <td><?php echo esc_html($user->display_name); ?></td>
                    <td><?php echo esc_html(implode(', ', $user->roles)); ?></td>
                    <td><?php echo date('d/m/Y', strtotime($user->user_registered)); ?></td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
        <?php
    }

    /**
     * Página de Documentação
     */
    public function docs_page() {
        if (!current_user_can('manage_options')) return;
        
        $api_base = rest_url(self::REST_NAMESPACE . '/');
        ?>
        <div class="wrap">
            <h1><span class="dashicons dashicons-book" style="margin-right: 10px;"></span>Documentação da API</h1>
            
            <div style="background: #fff; padding: 25px; border: 1px solid #c3c4c7; border-radius: 4px; margin: 20px 0;">
                <h2 style="margin-top: 0;">Base URL</h2>
                <code style="font-size: 14px; padding: 10px; display: block; background: #f6f7f7; border-radius: 4px;">
                    <?php echo esc_url($api_base); ?>
                </code>
                
                <h2>Autenticação</h2>
                <p>Todas as requisições devem incluir o header:</p>
                <code style="display: block; padding: 10px; background: #2d2d2d; color: #f8f8f2; border-radius: 4px;">
                    X-OnHub-Key: SUA_API_KEY
                </code>
                
                <h2>Endpoints Disponíveis</h2>
                <table class="widefat" style="margin-top: 15px;">
                    <thead>
                        <tr>
                            <th>Método</th>
                            <th>Endpoint</th>
                            <th>Descrição</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><span style="background: #61affe; color: white; padding: 2px 8px; border-radius: 3px;">GET</span></td>
                            <td><code>/tables/{tabela}</code></td>
                            <td>Listar todos os registros</td>
                        </tr>
                        <tr>
                            <td><span style="background: #61affe; color: white; padding: 2px 8px; border-radius: 3px;">GET</span></td>
                            <td><code>/tables/{tabela}/{id}</code></td>
                            <td>Obter registro específico</td>
                        </tr>
                        <tr>
                            <td><span style="background: #49cc90; color: white; padding: 2px 8px; border-radius: 3px;">POST</span></td>
                            <td><code>/tables/{tabela}</code></td>
                            <td>Criar novo registro</td>
                        </tr>
                        <tr>
                            <td><span style="background: #fca130; color: white; padding: 2px 8px; border-radius: 3px;">PUT</span></td>
                            <td><code>/tables/{tabela}/{id}</code></td>
                            <td>Atualizar registro</td>
                        </tr>
                        <tr>
                            <td><span style="background: #f93e3e; color: white; padding: 2px 8px; border-radius: 3px;">DELETE</span></td>
                            <td><code>/tables/{tabela}/{id}</code></td>
                            <td>Excluir registro</td>
                        </tr>
                        <tr>
                            <td><span style="background: #49cc90; color: white; padding: 2px 8px; border-radius: 3px;">POST</span></td>
                            <td><code>/sync</code></td>
                            <td>Sincronizar dados do OnHub</td>
                        </tr>
                    </tbody>
                </table>
                
                <h2>Tabelas Disponíveis</h2>
                <ul style="list-style: disc; margin-left: 20px;">
                    <?php foreach (self::TABLES as $slug => $def): ?>
                    <li>
                        <strong><?php echo esc_html($def['label']); ?></strong> 
                        (<code><?php echo esc_html($slug); ?></code>)
                        - Campos: <?php echo esc_html(implode(', ', $def['fields'])); ?>
                    </li>
                    <?php endforeach; ?>
                </ul>
                
                <h2>Exemplo de Requisição</h2>
                <pre style="background: #2d2d2d; color: #f8f8f2; padding: 15px; border-radius: 4px; overflow-x: auto;">
<span style="color: #66d9ef;">// Criar uma pasta</span>
<span style="color: #f92672;">POST</span> <?php echo esc_url($api_base); ?>tables/folders
<span style="color: #66d9ef;">Headers:</span>
  X-OnHub-Key: onhub_sua_api_key_aqui
  Content-Type: application/json

<span style="color: #66d9ef;">Body:</span>
{
  "post_title": "Minha Pasta",
  "meta": {
    "name": "Minha Pasta",
    "owner": "user@email.com",
    "parent_id": null,
    "color": "#3b82f6"
  }
}</pre>

                <h2>Exemplo de Sincronização</h2>
                <pre style="background: #2d2d2d; color: #f8f8f2; padding: 15px; border-radius: 4px; overflow-x: auto;">
<span style="color: #66d9ef;">// Sincronizar dados do OnHub para WordPress</span>
<span style="color: #f92672;">POST</span> <?php echo esc_url($api_base); ?>sync
<span style="color: #66d9ef;">Headers:</span>
  X-OnHub-Key: onhub_sua_api_key_aqui
  Content-Type: application/json

<span style="color: #66d9ef;">Body:</span>
{
  "table": "folders",
  "data": [
    { "id": "123", "name": "Pasta 1", "owner": "user@email.com" },
    { "id": "456", "name": "Pasta 2", "owner": "user@email.com" }
  ]
}</pre>
            </div>
        </div>
        <?php
    }

    /* ============================================
     * REST API
     * ============================================ */

    public function allow_cors_headers($served, $result, $request, $server) {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Authorization, Content-Type, X-OnHub-Key, X-Supabase-Lite-Key, X-Requested-With');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');
        return $served;
    }

    public function register_routes() {
        $ns = self::REST_NAMESPACE;
        
        // CRUD para tabelas
        register_rest_route($ns, '/tables/(?P<table>[a-zA-Z0-9_-]+)', [
            ['methods' => 'GET', 'callback' => [$this, 'list_rows'], 'permission_callback' => [$this, 'auth_check']],
            ['methods' => 'POST', 'callback' => [$this, 'create_row'], 'permission_callback' => [$this, 'auth_check']],
        ]);

        register_rest_route($ns, '/tables/(?P<table>[a-zA-Z0-9_-]+)/(?P<id>[^/]+)', [
            ['methods' => 'GET', 'callback' => [$this, 'get_row'], 'permission_callback' => [$this, 'auth_check']],
            ['methods' => 'PUT', 'callback' => [$this, 'update_row'], 'permission_callback' => [$this, 'auth_check']],
            ['methods' => 'DELETE', 'callback' => [$this, 'delete_row'], 'permission_callback' => [$this, 'auth_check']],
        ]);
        
        // Sync endpoint
        register_rest_route($ns, '/sync', [
            ['methods' => 'POST', 'callback' => [$this, 'sync_data'], 'permission_callback' => [$this, 'auth_check']],
        ]);
        
        // Health check
        register_rest_route($ns, '/health', [
            ['methods' => 'GET', 'callback' => [$this, 'health_check'], 'permission_callback' => '__return_true'],
        ]);
    }

    public function auth_check($request) {
        $provided = $request->get_header('X-OnHub-Key') ?? $request->get_header('X-Supabase-Lite-Key') ?? $request->get_param('api_key') ?? '';
        $keys = get_option(self::OPTION_KEY, []);

        if (empty($provided)) {
            return new WP_Error('no_key', 'API key não fornecida', ['status' => 401]);
        }
        if (!isset($keys[$provided])) {
            return new WP_Error('invalid_key', 'API key inválida', ['status' => 403]);
        }
        
        // Atualizar último uso
        $keys[$provided]['last_used'] = current_time('mysql');
        update_option(self::OPTION_KEY, $keys);
        
        return true;
    }

    public function health_check($request) {
        return rest_ensure_response([
            'status' => 'ok',
            'version' => self::VERSION,
            'timestamp' => current_time('mysql'),
            'tables' => array_keys(self::TABLES),
        ]);
    }

    private function get_table_type($table) {
        return self::TABLES[$table]['type'] ?? null;
    }

    private function post_to_row($p) {
        $meta = [];
        $all_meta = get_post_meta($p->ID);
        foreach ($all_meta as $k => $v) {
            if (strpos($k, '_') === 0) continue;
            $meta[$k] = (count($v) === 1) ? maybe_unserialize($v[0]) : array_map('maybe_unserialize', $v);
        }
        
        return array_merge([
            'id' => (string) $p->ID,
            'title' => $p->post_title,
            'content' => $p->post_content,
            'status' => $p->post_status,
            'created_at' => $p->post_date,
            'updated_at' => $p->post_modified,
        ], $meta);
    }

    private function user_to_row($u) {
        return [
            'id' => (string) $u->ID,
            'email' => $u->user_email,
            'full_name' => trim($u->first_name . ' ' . $u->last_name) ?: $u->display_name,
            'role' => implode(',', $u->roles),
            'created_at' => $u->user_registered,
        ];
    }

    public function list_rows($request) {
        $table = $request->get_param('table');
        if (!isset(self::TABLES[$table])) {
            return new WP_Error('invalid_table', 'Tabela não encontrada', ['status' => 404]);
        }

        $per_page = max(1, min(100, intval($request->get_param('per_page') ?? 50)));
        $page = max(1, intval($request->get_param('page') ?? 1));

        if ($table === 'users') {
            $users = get_users(['number' => $per_page, 'offset' => ($page - 1) * $per_page]);
            return rest_ensure_response(array_map([$this, 'user_to_row'], $users));
        }

        $type = $this->get_table_type($table);
        $posts = get_posts([
            'post_type' => $type,
            'posts_per_page' => $per_page,
            'paged' => $page,
            'post_status' => ['publish', 'private', 'draft'],
        ]);
        
        return rest_ensure_response(array_map([$this, 'post_to_row'], $posts));
    }

    public function get_row($request) {
        $table = $request->get_param('table');
        $id = $request->get_param('id');
        
        if (!isset(self::TABLES[$table])) {
            return new WP_Error('invalid_table', 'Tabela não encontrada', ['status' => 404]);
        }

        if ($table === 'users') {
            $u = get_userdata(intval($id));
            if (!$u) return new WP_Error('not_found', 'Usuário não encontrado', ['status' => 404]);
            return rest_ensure_response($this->user_to_row($u));
        }

        $p = get_post($id);
        if (!$p) return new WP_Error('not_found', 'Registro não encontrado', ['status' => 404]);
        return rest_ensure_response($this->post_to_row($p));
    }

    public function create_row($request) {
        $table = $request->get_param('table');
        $body = $request->get_json_params();
        
        if (!isset(self::TABLES[$table])) {
            return new WP_Error('invalid_table', 'Tabela não encontrada', ['status' => 404]);
        }

        if ($table === 'users') {
            $userdata = [
                'user_login' => sanitize_user($body['email'] ?? $body['user_login'] ?? ''),
                'user_email' => sanitize_email($body['email'] ?? ''),
                'user_pass' => wp_generate_password(),
                'display_name' => $body['full_name'] ?? '',
            ];
            $id = wp_insert_user($userdata);
            if (is_wp_error($id)) return $id;
            return rest_ensure_response(['id' => (string) $id]);
        }

        $type = $this->get_table_type($table);
        $postarr = [
            'post_type' => $type,
            'post_title' => sanitize_text_field($body['name'] ?? $body['post_title'] ?? 'Novo Item'),
            'post_content' => $body['content'] ?? $body['post_content'] ?? '',
            'post_status' => 'publish',
        ];

        $post_id = wp_insert_post($postarr, true);
        if (is_wp_error($post_id)) return $post_id;

        // Salvar metadados
        $meta = $body['meta'] ?? $body;
        foreach (self::TABLES[$table]['fields'] as $field) {
            if (isset($meta[$field])) {
                update_post_meta($post_id, $field, $meta[$field]);
            }
        }
        
        // Salvar ID original do OnHub
        if (isset($body['id'])) {
            update_post_meta($post_id, 'onhub_id', $body['id']);
        }

        return rest_ensure_response(['id' => (string) $post_id, 'onhub_id' => $body['id'] ?? null]);
    }

    public function update_row($request) {
        $table = $request->get_param('table');
        $id = $request->get_param('id');
        $body = $request->get_json_params();
        
        if (!isset(self::TABLES[$table])) {
            return new WP_Error('invalid_table', 'Tabela não encontrada', ['status' => 404]);
        }

        if ($table === 'users') {
            $userdata = ['ID' => intval($id)];
            if (isset($body['email'])) $userdata['user_email'] = sanitize_email($body['email']);
            if (isset($body['full_name'])) $userdata['display_name'] = $body['full_name'];
            $res = wp_update_user($userdata);
            if (is_wp_error($res)) return $res;
            return rest_ensure_response(['id' => (string) $res]);
        }

        $post = get_post($id);
        if (!$post) return new WP_Error('not_found', 'Registro não encontrado', ['status' => 404]);

        $postarr = ['ID' => $post->ID];
        if (isset($body['name'])) $postarr['post_title'] = sanitize_text_field($body['name']);
        if (isset($body['content'])) $postarr['post_content'] = $body['content'];

        $res = wp_update_post($postarr, true);
        if (is_wp_error($res)) return $res;

        // Atualizar metadados
        $meta = $body['meta'] ?? $body;
        foreach (self::TABLES[$table]['fields'] as $field) {
            if (isset($meta[$field])) {
                update_post_meta($post->ID, $field, $meta[$field]);
            }
        }

        return rest_ensure_response(['id' => (string) $res]);
    }

    public function delete_row($request) {
        $table = $request->get_param('table');
        $id = $request->get_param('id');
        
        if (!isset(self::TABLES[$table])) {
            return new WP_Error('invalid_table', 'Tabela não encontrada', ['status' => 404]);
        }

        if ($table === 'users') {
            require_once ABSPATH . 'wp-admin/includes/user.php';
            $res = wp_delete_user(intval($id));
            if (!$res) return new WP_Error('delete_fail', 'Falha ao deletar', ['status' => 500]);
            return rest_ensure_response(['deleted' => true]);
        }

        $res = wp_delete_post(intval($id), true);
        if (!$res) return new WP_Error('delete_fail', 'Falha ao deletar', ['status' => 500]);
        return rest_ensure_response(['deleted' => true]);
    }

    public function sync_data($request) {
        $body = $request->get_json_params();
        $table = $body['table'] ?? null;
        $data = $body['data'] ?? [];
        
        if (!$table || !isset(self::TABLES[$table])) {
            return new WP_Error('invalid_table', 'Tabela não especificada ou inválida', ['status' => 400]);
        }
        
        if (empty($data) || !is_array($data)) {
            return new WP_Error('no_data', 'Nenhum dado para sincronizar', ['status' => 400]);
        }
        
        $synced = 0;
        $errors = [];
        
        foreach ($data as $item) {
            try {
                // Verificar se já existe pelo onhub_id
                $existing = get_posts([
                    'post_type' => self::TABLES[$table]['type'],
                    'meta_key' => 'onhub_id',
                    'meta_value' => $item['id'],
                    'posts_per_page' => 1,
                ]);
                
                if (!empty($existing)) {
                    // Atualizar existente
                    $post_id = $existing[0]->ID;
                    wp_update_post([
                        'ID' => $post_id,
                        'post_title' => $item['name'] ?? $existing[0]->post_title,
                    ]);
                } else {
                    // Criar novo
                    $post_id = wp_insert_post([
                        'post_type' => self::TABLES[$table]['type'],
                        'post_title' => $item['name'] ?? 'Item ' . $item['id'],
                        'post_status' => 'publish',
                    ]);
                    update_post_meta($post_id, 'onhub_id', $item['id']);
                }
                
                // Atualizar metadados
                foreach (self::TABLES[$table]['fields'] as $field) {
                    if (isset($item[$field])) {
                        update_post_meta($post_id, $field, $item[$field]);
                    }
                }
                
                $synced++;
            } catch (Exception $e) {
                $errors[] = ['id' => $item['id'] ?? 'unknown', 'error' => $e->getMessage()];
            }
        }
        
        // Atualizar timestamp de última sincronização
        $config = get_option(self::CONFIG_KEY, []);
        $config['last_sync'] = current_time('mysql');
        update_option(self::CONFIG_KEY, $config);
        
        return rest_ensure_response([
            'success' => true,
            'synced' => $synced,
            'total' => count($data),
            'errors' => $errors,
        ]);
    }
}

new OnHubWPSync();
