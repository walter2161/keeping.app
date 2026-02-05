import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Download, 
  Globe, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Copy, 
  ExternalLink,
  Database,
  RefreshCw,
  FileCode,
  Server,
  Shield,
  Plug
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { onhub, setWpConfig, clearWpConfig, isWpConnected, wpSync } from '@/api/onhubClient';

const WP_CONFIG_KEY = 'onhub_wp_config';

const loadWpConfig = () => {
  try {
    const config = localStorage.getItem(WP_CONFIG_KEY);
    return config ? JSON.parse(config) : { url: '', apiKey: '', autoSync: true };
  } catch {
    return { url: '', apiKey: '', autoSync: true };
  }
};

export default function WordPressIntegration({ user }) {
  const savedConfig = loadWpConfig();
  const [showDialog, setShowDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('download');
  const [wpUrl, setWpUrl] = useState(savedConfig.url || '');
  const [apiKey, setApiKey] = useState(savedConfig.apiKey || '');
  const [autoSync, setAutoSync] = useState(savedConfig.autoSync !== false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [isConnected, setIsConnected] = useState(isWpConnected());

  const handleDownloadPlugin = () => {
    // Gerar o arquivo PHP do plugin
    const phpContent = generatePluginCode();
    const blob = new Blob([phpContent], { type: 'application/x-php' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'onhub-wp-sync.php';
    a.click();
    URL.revokeObjectURL(url);
  };

  const generatePluginCode = () => {
    // Retorna o conteúdo completo do plugin PHP em um único arquivo
    return `<?php
/**
 * Plugin Name: OnHub WP Sync
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
    
    const TABLES = [
        'folders' => ['label' => 'Pastas', 'type' => 'onhub_folder', 'icon' => 'dashicons-category', 'fields' => ['name', 'parent_id', 'team_id', 'owner', 'deleted', 'color', 'icon']],
        'files' => ['label' => 'Arquivos', 'type' => 'onhub_file', 'icon' => 'dashicons-media-document', 'fields' => ['name', 'type', 'content', 'folder_id', 'team_id', 'owner', 'deleted', 'file_url']],
        'teams' => ['label' => 'Equipes', 'type' => 'onhub_team', 'icon' => 'dashicons-groups', 'fields' => ['name', 'description', 'owner', 'members', 'color', 'icon']],
        'team_invitations' => ['label' => 'Convites', 'type' => 'onhub_invitation', 'icon' => 'dashicons-email-alt', 'fields' => ['team_id', 'email', 'status', 'invited_by', 'expires_at']],
        'team_activities' => ['label' => 'Atividades', 'type' => 'onhub_activity', 'icon' => 'dashicons-clock', 'fields' => ['team_id', 'user_email', 'action', 'entity_type', 'entity_id', 'details']],
        'active_sessions' => ['label' => 'Sessões', 'type' => 'onhub_session', 'icon' => 'dashicons-visibility', 'fields' => ['user_email', 'file_id', 'last_activity', 'cursor_position', 'is_editing']],
        'chat_messages' => ['label' => 'Chat', 'type' => 'onhub_chat', 'icon' => 'dashicons-format-chat', 'fields' => ['team_id', 'user_email', 'user_name', 'message', 'type', 'file_id']],
        'queries' => ['label' => 'Consultas', 'type' => 'onhub_query', 'icon' => 'dashicons-database', 'fields' => ['name', 'query', 'owner', 'folder_id', 'description']],
    ];

    public function __construct() {
        add_action('init', [$this, 'handle_preflight'], 1);
        add_action('init', [$this, 'register_all_cpts']);
        add_action('rest_api_init', [$this, 'register_routes']);
        add_action('admin_menu', [$this, 'admin_menu']);
        add_action('admin_init', [$this, 'register_settings']);
        add_filter('rest_pre_serve_request', [$this, 'allow_cors_headers'], 10, 4);
        register_activation_hook(__FILE__, [$this, 'on_activation']);
    }

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
        if (get_option(self::OPTION_KEY) === false) add_option(self::OPTION_KEY, []);
        if (get_option(self::CONFIG_KEY) === false) add_option(self::CONFIG_KEY, ['onhub_url' => '', 'sync_enabled' => false, 'last_sync' => null]);
        $this->register_all_cpts();
        flush_rewrite_rules();
    }

    public function register_all_cpts() {
        foreach (self::TABLES as $slug => $def) {
            register_post_type($def['type'], [
                'labels' => ['name' => $def['label'], 'singular_name' => $def['label']],
                'public' => false, 'show_ui' => true, 'show_in_menu' => 'onhub-sync',
                'capability_type' => 'post', 'supports' => ['title', 'custom-fields'],
            ]);
        }
    }

    public function admin_menu() {
        add_menu_page('OnHub Sync', 'OnHub Sync', 'manage_options', 'onhub-sync', [$this, 'admin_dashboard'], 'dashicons-cloud-saved', 30);
        add_submenu_page('onhub-sync', 'API Keys', 'API Keys', 'manage_options', 'onhub-api-keys', [$this, 'api_keys_page']);
    }

    public function register_settings() {
        register_setting('onhub_settings_group', self::OPTION_KEY);
        register_setting('onhub_settings_group', self::CONFIG_KEY);
    }

    public function admin_dashboard() {
        if (!current_user_can('manage_options')) return;
        $keys = get_option(self::OPTION_KEY, []);
        $counts = [];
        foreach (self::TABLES as $slug => $def) {
            $counts[$slug] = wp_count_posts($def['type'])->publish + wp_count_posts($def['type'])->private;
        }
        ?>
        <div class="wrap">
            <h1><span class="dashicons dashicons-cloud-saved"></span> OnHub WP Sync</h1>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;margin-top:20px;">
                <?php foreach (self::TABLES as $slug => $def): ?>
                <div style="background:#fff;padding:20px;border-radius:8px;border:1px solid #e0e0e0;">
                    <span class="dashicons <?php echo $def['icon']; ?>" style="font-size:24px;color:#2271b1;"></span>
                    <div style="font-weight:600;"><?php echo $def['label']; ?></div>
                    <div style="font-size:24px;font-weight:bold;color:#2271b1;"><?php echo $counts[$slug]; ?></div>
                </div>
                <?php endforeach; ?>
            </div>
            <p style="margin-top:20px;"><strong><?php echo count($keys); ?></strong> API Key(s) ativa(s). <a href="<?php echo admin_url('admin.php?page=onhub-api-keys'); ?>">Gerenciar</a></p>
        </div>
        <?php
    }

    public function api_keys_page() {
        if (!current_user_can('manage_options')) return;
        $keys = get_option(self::OPTION_KEY, []);
        
        if (isset($_POST['onhub_create_key']) && check_admin_referer('onhub_create_key')) {
            $label = sanitize_text_field($_POST['key_label'] ?? 'Nova Key');
            $new_key = 'onhub_' . bin2hex(random_bytes(24));
            $keys[$new_key] = ['label' => $label, 'permissions' => ['read', 'write'], 'created' => current_time('mysql'), 'last_used' => null];
            update_option(self::OPTION_KEY, $keys);
            echo '<div class="notice notice-success"><p><strong>API Key criada:</strong><br><code style="font-size:14px;padding:10px;display:block;background:#f0f0f0;margin-top:10px;">' . esc_html($new_key) . '</code></p></div>';
        }
        
        if (isset($_GET['revoke']) && check_admin_referer('onhub_revoke_' . $_GET['revoke'])) {
            unset($keys[sanitize_text_field($_GET['revoke'])]);
            update_option(self::OPTION_KEY, $keys);
            echo '<div class="updated"><p>API Key revogada.</p></div>';
        }
        ?>
        <div class="wrap">
            <h1><span class="dashicons dashicons-admin-network"></span> API Keys</h1>
            <div style="background:#fff;padding:20px;border:1px solid #c3c4c7;border-radius:4px;margin:20px 0;">
                <h2 style="margin-top:0;">Criar Nova API Key</h2>
                <form method="post">
                    <?php wp_nonce_field('onhub_create_key'); ?>
                    <p><label>Nome: <input type="text" name="key_label" value="OnHub App" required></label></p>
                    <p><input type="submit" name="onhub_create_key" class="button button-primary" value="Criar API Key"></p>
                </form>
            </div>
            <h2>API Keys Ativas</h2>
            <?php if (empty($keys)): ?>
                <p>Nenhuma API key criada.</p>
            <?php else: ?>
            <table class="wp-list-table widefat fixed striped">
                <thead><tr><th>Key (parcial)</th><th>Rótulo</th><th>Criada</th><th>Ações</th></tr></thead>
                <tbody>
                <?php foreach ($keys as $key => $meta): ?>
                <tr>
                    <td><code><?php echo esc_html(substr($key, 0, 20) . '...'); ?></code></td>
                    <td><?php echo esc_html($meta['label']); ?></td>
                    <td><?php echo esc_html($meta['created']); ?></td>
                    <td><a href="<?php echo wp_nonce_url(admin_url('admin.php?page=onhub-api-keys&revoke=' . $key), 'onhub_revoke_' . $key); ?>" class="button button-small" onclick="return confirm('Revogar esta key?');">Revogar</a></td>
                </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
            <?php endif; ?>
        </div>
        <?php
    }

    public function allow_cors_headers($served, $result, $request, $server) {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-OnHub-Key, Authorization, X-Requested-With');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { status_header(200); exit; }
        return $served;
    }

    private function validate_api_key($request) {
        $key = $request->get_header('X-OnHub-Key');
        if (!$key) return new WP_Error('no_key', 'API Key obrigatória', ['status' => 401]);
        $keys = get_option(self::OPTION_KEY, []);
        if (!isset($keys[$key])) return new WP_Error('invalid_key', 'API Key inválida', ['status' => 403]);
        $keys[$key]['last_used'] = current_time('mysql');
        update_option(self::OPTION_KEY, $keys);
        return true;
    }

    public function register_routes() {
        register_rest_route(self::REST_NAMESPACE, '/health', ['methods' => 'GET', 'callback' => [$this, 'health_check'], 'permission_callback' => '__return_true']);
        
        foreach (self::TABLES as $slug => $def) {
            register_rest_route(self::REST_NAMESPACE, '/' . $slug, [
                ['methods' => 'GET', 'callback' => function($r) use ($def) { return $this->get_items($r, $def); }, 'permission_callback' => [$this, 'validate_api_key']],
                ['methods' => 'POST', 'callback' => function($r) use ($def) { return $this->create_item($r, $def); }, 'permission_callback' => [$this, 'validate_api_key']],
            ]);
            register_rest_route(self::REST_NAMESPACE, '/' . $slug . '/(?P<id>[\\\\w-]+)', [
                ['methods' => 'GET', 'callback' => function($r) use ($def) { return $this->get_item($r, $def); }, 'permission_callback' => [$this, 'validate_api_key']],
                ['methods' => 'PUT', 'callback' => function($r) use ($def) { return $this->update_item($r, $def); }, 'permission_callback' => [$this, 'validate_api_key']],
                ['methods' => 'DELETE', 'callback' => function($r) use ($def) { return $this->delete_item($r, $def); }, 'permission_callback' => [$this, 'validate_api_key']],
            ]);
        }
        
        register_rest_route(self::REST_NAMESPACE, '/sync', ['methods' => 'POST', 'callback' => [$this, 'bulk_sync'], 'permission_callback' => [$this, 'validate_api_key']]);
    }

    public function health_check() {
        return rest_ensure_response(['status' => 'ok', 'version' => self::VERSION, 'tables' => array_keys(self::TABLES), 'time' => current_time('mysql')]);
    }

    public function get_items($request, $def) {
        $posts = get_posts(['post_type' => $def['type'], 'numberposts' => -1, 'post_status' => 'any']);
        $items = [];
        foreach ($posts as $post) {
            $item = ['id' => get_post_meta($post->ID, 'onhub_id', true) ?: $post->ID, 'wp_id' => $post->ID, 'created_at' => $post->post_date, 'updated_at' => $post->post_modified];
            foreach ($def['fields'] as $field) { $item[$field] = get_post_meta($post->ID, $field, true); }
            $items[] = $item;
        }
        return rest_ensure_response($items);
    }

    public function get_item($request, $def) {
        $id = $request['id'];
        $posts = get_posts(['post_type' => $def['type'], 'meta_key' => 'onhub_id', 'meta_value' => $id, 'numberposts' => 1, 'post_status' => 'any']);
        if (empty($posts)) return new WP_Error('not_found', 'Item não encontrado', ['status' => 404]);
        $post = $posts[0];
        $item = ['id' => $id, 'wp_id' => $post->ID, 'created_at' => $post->post_date, 'updated_at' => $post->post_modified];
        foreach ($def['fields'] as $field) { $item[$field] = get_post_meta($post->ID, $field, true); }
        return rest_ensure_response($item);
    }

    public function create_item($request, $def) {
        $data = $request->get_json_params();
        $title = $data['name'] ?? $data['email'] ?? $data['id'] ?? 'Item OnHub';
        $post_id = wp_insert_post(['post_type' => $def['type'], 'post_title' => $title, 'post_status' => 'publish']);
        if (is_wp_error($post_id)) return $post_id;
        if (isset($data['id'])) update_post_meta($post_id, 'onhub_id', $data['id']);
        foreach ($def['fields'] as $field) { if (isset($data[$field])) update_post_meta($post_id, $field, $data[$field]); }
        return rest_ensure_response(['success' => true, 'id' => $data['id'] ?? $post_id, 'wp_id' => $post_id]);
    }

    public function update_item($request, $def) {
        $id = $request['id'];
        $data = $request->get_json_params();
        $posts = get_posts(['post_type' => $def['type'], 'meta_key' => 'onhub_id', 'meta_value' => $id, 'numberposts' => 1, 'post_status' => 'any']);
        if (empty($posts)) return $this->create_item($request, $def);
        $post = $posts[0];
        foreach ($def['fields'] as $field) { if (isset($data[$field])) update_post_meta($post->ID, $field, $data[$field]); }
        if (isset($data['name']) || isset($data['email'])) wp_update_post(['ID' => $post->ID, 'post_title' => $data['name'] ?? $data['email']]);
        return rest_ensure_response(['success' => true, 'id' => $id, 'wp_id' => $post->ID, 'updated' => true]);
    }

    public function delete_item($request, $def) {
        $id = $request['id'];
        $posts = get_posts(['post_type' => $def['type'], 'meta_key' => 'onhub_id', 'meta_value' => $id, 'numberposts' => 1, 'post_status' => 'any']);
        if (empty($posts)) return new WP_Error('not_found', 'Item não encontrado', ['status' => 404]);
        wp_delete_post($posts[0]->ID, true);
        return rest_ensure_response(['success' => true, 'id' => $id, 'deleted' => true]);
    }

    public function bulk_sync($request) {
        $data = $request->get_json_params();
        $table = $data['table'] ?? null;
        $items = $data['data'] ?? [];
        if (!$table || !isset(self::TABLES[$table])) return new WP_Error('invalid_table', 'Tabela inválida', ['status' => 400]);
        $def = self::TABLES[$table];
        $synced = 0; $errors = 0;
        foreach ($items as $item) {
            $id = $item['id'] ?? null;
            $posts = $id ? get_posts(['post_type' => $def['type'], 'meta_key' => 'onhub_id', 'meta_value' => $id, 'numberposts' => 1, 'post_status' => 'any']) : [];
            $title = $item['name'] ?? $item['email'] ?? $id ?? 'Item OnHub';
            if (!empty($posts)) {
                $post = $posts[0];
                foreach ($def['fields'] as $field) { if (isset($item[$field])) update_post_meta($post->ID, $field, $item[$field]); }
                $synced++;
            } else {
                $post_id = wp_insert_post(['post_type' => $def['type'], 'post_title' => $title, 'post_status' => 'publish']);
                if (!is_wp_error($post_id)) {
                    if ($id) update_post_meta($post_id, 'onhub_id', $id);
                    foreach ($def['fields'] as $field) { if (isset($item[$field])) update_post_meta($post_id, $field, $item[$field]); }
                    $synced++;
                } else { $errors++; }
            }
        }
        $config = get_option(self::CONFIG_KEY, []);
        $config['last_sync'] = current_time('mysql');
        update_option(self::CONFIG_KEY, $config);
        return rest_ensure_response(['success' => true, 'table' => $table, 'synced' => $synced, 'errors' => $errors, 'total' => count($items)]);
    }
}

new OnHubWPSync();
`;
  };

  const testConnection = async () => {
    if (!wpUrl || !apiKey) {
      setTestResult({ success: false, message: 'Preencha a URL e a API Key' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const cleanUrl = wpUrl.replace(/\/+$/, '');
      // Use proxy to avoid CORS
      const data = await wpSync.healthCheck(cleanUrl, apiKey);

      // Save config for auto-sync
      setWpConfig(cleanUrl, apiKey, autoSync);
      setIsConnected(true);
      setTestResult({ 
        success: true, 
        message: `Conexao estabelecida! Versao: ${data.version}. Sync automatico ${autoSync ? 'ativado' : 'desativado'}.`,
        data 
      });
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: `Erro de conexao: ${error.message}` 
      });
    } finally {
      setTesting(false);
    }
  };

  const disconnectWp = () => {
    clearWpConfig();
    setIsConnected(false);
    setWpUrl('');
    setApiKey('');
    setTestResult(null);
    setSyncResult(null);
  };

  const syncToWordPress = async () => {
    if (!isConnected && (!wpUrl || !apiKey)) {
      setSyncResult({ success: false, message: 'Configure a conexao primeiro' });
      return;
    }

    // Ensure config is saved before syncing
    if (wpUrl && apiKey) {
      setWpConfig(wpUrl.replace(/\/+$/, ''), apiKey, autoSync);
    }

    setSyncing(true);
    setSyncResult(null);

    try {
      // Fetch all data from OnHub localStorage
      const [folders, files, teams, teamInvitations, teamActivities, activeSessions, chatMessages, queries] = await Promise.all([
        onhub.entities.Folder.list(),
        onhub.entities.File.list(),
        onhub.entities.Team.list(),
        onhub.entities.TeamInvitation.list(),
        onhub.entities.TeamActivity.list(),
        onhub.entities.ActiveSession.list(),
        onhub.entities.ChatMessage.list(),
        onhub.entities.Query.list(),
      ]);

      const tables = [
        { name: 'folders', data: folders },
        { name: 'files', data: files },
        { name: 'teams', data: teams },
        { name: 'team_invitations', data: teamInvitations },
        { name: 'team_activities', data: teamActivities },
        { name: 'active_sessions', data: activeSessions },
        { name: 'chat_messages', data: chatMessages },
        { name: 'queries', data: queries },
      ];

      const results = {};
      let totalSynced = 0;
      let totalErrors = 0;

      for (const table of tables) {
        if (table.data.length > 0) {
          try {
            const res = await wpSync.bulkSync(table.name, table.data);
            results[table.name] = { synced: res.synced || 0, errors: res.errors || 0 };
            totalSynced += res.synced || 0;
            totalErrors += res.errors || 0;
          } catch (err) {
            results[table.name] = { synced: 0, errors: table.data.length, message: err.message };
            totalErrors += table.data.length;
          }
        } else {
          results[table.name] = { synced: 0, errors: 0 };
        }
      }

      setSyncResult({
        success: totalErrors === 0,
        message: `Sincronizacao concluida! ${totalSynced} itens sincronizados.${totalErrors > 0 ? ` ${totalErrors} erros.` : ''}`,
        details: results,
      });
    } catch (error) {
      setSyncResult({
        success: false,
        message: `Erro na sincronizacao: ${error.message}`,
      });
    } finally {
      setSyncing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            Integração WordPress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-700 mb-3">
              Conecte o OnHub ao seu site WordPress para sincronizar e fazer backup dos seus dados.
            </p>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Backup automático de todas as suas pastas e arquivos</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Sincronização bidirecional com WordPress</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>API REST segura com autenticação por chave</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Suporte a todas as entidades: Pastas, Arquivos, Equipes, etc.</span>
              </div>
            </div>
          </div>

          {isConnected && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">Sincronização Automática Ativa</p>
                  <p className="text-xs text-green-600">Todas as alterações serão enviadas automaticamente para o WordPress</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={() => setShowDialog(true)}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Plug className="w-4 h-4 mr-2" />
              {isConnected ? 'Configurações' : 'Configurar Integração'}
            </Button>
            {isConnected && (
              <Button 
                variant="outline" 
                onClick={disconnectWp}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Desconectar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              Integração WordPress - OnHub Sync
            </DialogTitle>
            <DialogDescription>
              Configure a integração para sincronizar seus dados com WordPress
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="download">
                <Download className="w-4 h-4 mr-2" />
                Plugin
              </TabsTrigger>
              <TabsTrigger value="install">
                <FileCode className="w-4 h-4 mr-2" />
                Instalação
              </TabsTrigger>
              <TabsTrigger value="connect">
                <Key className="w-4 h-4 mr-2" />
                Conectar
              </TabsTrigger>
              <TabsTrigger value="sync">
                <RefreshCw className="w-4 h-4 mr-2" />
                Sincronizar
              </TabsTrigger>
            </TabsList>

            {/* Tab: Download */}
            <TabsContent value="download" className="space-y-4 mt-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Passo 1: Baixar o Plugin
                </h3>
                <p className="text-sm text-blue-800 mb-4">
                  Baixe o plugin OnHub WP Sync para instalar no seu WordPress.
                </p>
                
                <Button onClick={handleDownloadPlugin} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Plugin WordPress (.php)
                </Button>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">O que o plugin inclui:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-600" />
                    9 Custom Post Types para todas as entidades do OnHub
                  </li>
                  <li className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-green-600" />
                    API REST completa com CRUD
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-600" />
                    Sistema de autenticação por API Key
                  </li>
                  <li className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-orange-600" />
                    Endpoint de sincronização em lote
                  </li>
                </ul>
              </div>
            </TabsContent>

            {/* Tab: Instalação */}
            <TabsContent value="install" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-semibold flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center">1</span>
                    Upload do Plugin
                  </h3>
                  <ol className="text-sm text-gray-700 space-y-2 ml-8">
                    <li>Acesse o painel admin do WordPress</li>
                    <li>Vá em <strong>Plugins &gt; Adicionar Novo &gt; Enviar Plugin</strong></li>
                    <li>Selecione o arquivo <code className="bg-gray-100 px-1 rounded">onhub-wp-sync.php</code></li>
                    <li>Clique em <strong>Instalar Agora</strong></li>
                  </ol>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-semibold flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center">2</span>
                    Ativar o Plugin
                  </h3>
                  <ol className="text-sm text-gray-700 space-y-2 ml-8">
                    <li>Após instalar, clique em <strong>Ativar Plugin</strong></li>
                    <li>Um novo menu <strong>OnHub Sync</strong> aparecerá no painel</li>
                  </ol>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-semibold flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center">3</span>
                    Criar API Key
                  </h3>
                  <ol className="text-sm text-gray-700 space-y-2 ml-8">
                    <li>No WordPress, vá em <strong>OnHub Sync &gt; API Keys</strong></li>
                    <li>Clique em <strong>Criar API Key</strong></li>
                    <li>Copie a chave gerada (ela só aparece uma vez!)</li>
                    <li>Cole a chave na aba "Conectar" aqui no OnHub</li>
                  </ol>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Requisitos
                  </h4>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>WordPress 5.0 ou superior</li>
                    <li>PHP 7.4 ou superior</li>
                    <li>SSL habilitado (HTTPS) recomendado</li>
                    <li>Permissões de administrador</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            {/* Tab: Conectar */}
            <TabsContent value="connect" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    URL do seu site WordPress
                  </label>
                  <Input
                    value={wpUrl}
                    onChange={(e) => setWpUrl(e.target.value)}
                    placeholder="https://seusite.com.br"
                    className="font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ex: https://meusite.com.br (sem barra no final)
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    API Key do WordPress
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="onhub_xxxxxxxxxxxxxxxx"
                      type="password"
                      className="font-mono"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => copyToClipboard(apiKey)}
                      disabled={!apiKey}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Criada em OnHub Sync &gt; API Keys no WordPress
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-900">Sincronização Automática</p>
                        <p className="text-xs text-blue-700">Envia dados automaticamente ao criar, editar ou excluir</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoSync}
                        onChange={(e) => setAutoSync(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <Button 
                  onClick={testConnection} 
                  disabled={testing || !wpUrl || !apiKey}
                  className="w-full"
                >
                  {testing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testando conexão...
                    </>
                  ) : (
                    <>
                      <Plug className="w-4 h-4 mr-2" />
                      Testar Conexão
                    </>
                  )}
                </Button>

                {testResult && (
                  <div className={`p-4 rounded-lg border ${
                    testResult.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      {testResult.success ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                        {testResult.message}
                      </span>
                    </div>
                    {testResult.data && (
                      <div className="mt-2 text-xs text-green-700">
                        <p>Tabelas disponíveis: {testResult.data.tables?.join(', ')}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-gray-50 border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Endpoint da API:</h4>
                  <code className="text-sm bg-gray-200 px-2 py-1 rounded block">
                    {wpUrl || 'https://seusite.com.br'}/wp-json/onhub/v1/
                  </code>
                </div>
              </div>
            </TabsContent>

            {/* Tab: Sincronizar */}
            <TabsContent value="sync" className="space-y-4 mt-4">
              {!wpUrl || !apiKey ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertCircle className="w-5 h-5" />
                    <span>Configure a conexão primeiro na aba "Conectar"</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">
                      Sincronizar Dados para WordPress
                    </h3>
                    <p className="text-sm text-blue-800 mb-4">
                      Envie todos os seus dados do OnHub para o WordPress. Isso criará ou atualizará os registros no banco de dados do WordPress.
                    </p>
                    
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-white p-3 rounded border">
                        <Database className="w-5 h-5 text-blue-600 mb-1" />
                        <p className="text-xs text-gray-600">Pastas</p>
                      </div>
                      <div className="bg-white p-3 rounded border">
                        <FileCode className="w-5 h-5 text-green-600 mb-1" />
                        <p className="text-xs text-gray-600">Arquivos</p>
                      </div>
                      <div className="bg-white p-3 rounded border">
                        <Server className="w-5 h-5 text-purple-600 mb-1" />
                        <p className="text-xs text-gray-600">Equipes</p>
                      </div>
                    </div>

                    <Button 
                      onClick={syncToWordPress} 
                      disabled={syncing}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {syncing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sincronizando...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Sincronizar Agora
                        </>
                      )}
                    </Button>
                  </div>

                  {syncResult && (
                    <div className={`p-4 rounded-lg border ${
                      syncResult.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {syncResult.success ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                        <span className={`font-medium ${syncResult.success ? 'text-green-800' : 'text-red-800'}`}>
                          {syncResult.message}
                        </span>
                      </div>
                      {syncResult.details && (
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          <div className="bg-white p-2 rounded text-center">
                            <p className="text-lg font-bold text-blue-600">{syncResult.details.folders.synced}</p>
                            <p className="text-xs text-gray-600">Pastas</p>
                          </div>
                          <div className="bg-white p-2 rounded text-center">
                            <p className="text-lg font-bold text-green-600">{syncResult.details.files.synced}</p>
                            <p className="text-xs text-gray-600">Arquivos</p>
                          </div>
                          <div className="bg-white p-2 rounded text-center">
                            <p className="text-lg font-bold text-purple-600">{syncResult.details.teams.synced}</p>
                            <p className="text-xs text-gray-600">Equipes</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="bg-gray-50 border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Acessar WordPress
                    </h4>
                    <a 
                      href={`${wpUrl}/wp-admin/admin.php?page=onhub-sync`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Abrir painel OnHub Sync no WordPress
                    </a>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
