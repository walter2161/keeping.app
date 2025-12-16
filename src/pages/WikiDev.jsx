import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Code, Download, ArrowLeft, Database, Server, 
  Key, FileCode, Copy, Check, Loader2, AlertCircle
} from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function WikiDev() {
  const [copied, setCopied] = useState(false);
  const [wpUrl, setWpUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [testStatus, setTestStatus] = useState(null);
  const [testing, setTesting] = useState(false);
  
  const queryClient = useQueryClient();
  
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (user) {
      setWpUrl(user.wp_url || '');
      setApiKey(user.wp_api_key || '');
    }
  }, [user]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data) => {
      await base44.auth.updateMe(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    },
  });

  const handleTestConnection = async () => {
    setTesting(true);
    setTestStatus(null);

    try {
      const cleanUrl = wpUrl.trim().replace(/\/$/, '');
      const response = await fetch(`${cleanUrl}/wp-json/keeping/v1/test`, {
        headers: {
          'X-API-Key': apiKey.trim(),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTestStatus({ success: true, data });
      } else {
        const errorData = await response.json().catch(() => ({}));
        setTestStatus({ 
          success: false, 
          error: errorData.message || 'API Key inválida ou incorreta. Verifique suas credenciais.' 
        });
      }
    } catch (error) {
      setTestStatus({ success: false, error: 'Erro de conexão. Verifique se a URL do WordPress está correta e acessível.' });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConfig = async () => {
    await updateSettingsMutation.mutateAsync({
      wp_url: wpUrl.trim(),
      wp_api_key: apiKey.trim(),
    });
    alert('Configurações salvas com sucesso!');
  };

  const phpPlugin = `<?php
/**
 * Plugin Name: Keeping Database API
 * Description: API REST para integração Keeping - Banco de dados isolado por usuário
 * Version: 1.0.0
 * Author: Keeping Team
 * Text Domain: keeping
 */

if (!defined('ABSPATH')) exit;

define('KEEPING_VERSION', '1.0.0');
define('KEEPING_PREFIX', 'keeping_');
define('KEEPING_API_KEY', 'kp_live_7f8a9b2c4d6e1f3a5b7c9d2e4f6a8b0c1d3e5f7a9b2c4d6e8f0a2c4e6a8b0c2d4e'); // Chave gerada automaticamente - pode alterar se desejar

// Aumenta limites
@ini_set('memory_limit', '512M');
@ini_set('max_execution_time', '300');
@ini_set('post_max_size', '100M');
@ini_set('upload_max_filesize', '100M');

// ================================
// CORS HEADERS
// ================================
add_action('init', function() {
    if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-API-Key, Authorization');
        header('Access-Control-Max-Age: 86400');
        status_header(200);
        exit();
    }
});

add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-API-Key, Authorization');
        return $value;
    });
});

// ================================
// ATIVAÇÃO - CRIAÇÃO DAS TABELAS
// ================================
register_activation_hook(__FILE__, 'keeping_activate');

function keeping_activate() {
    global $wpdb;
    $charset = $wpdb->get_charset_collate();
    $prefix = $wpdb->prefix . KEEPING_PREFIX;

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');

    // Tabela de Pastas
    dbDelta("CREATE TABLE {$prefix}folders (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        parent_id VARCHAR(36),
        icon VARCHAR(100),
        color VARCHAR(50),
        \`order\` INT DEFAULT 0,
        deleted TINYINT(1) DEFAULT 0,
        deleted_at DATETIME,
        original_parent_id VARCHAR(36),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_email (user_email),
        INDEX idx_parent_id (parent_id),
        INDEX idx_deleted (deleted)
    ) $charset;");

    // Tabela de Arquivos
    dbDelta("CREATE TABLE {$prefix}files (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        folder_id VARCHAR(36),
        type VARCHAR(50) NOT NULL,
        content LONGTEXT,
        file_url VARCHAR(500),
        \`order\` INT DEFAULT 0,
        deleted TINYINT(1) DEFAULT 0,
        deleted_at DATETIME,
        original_folder_id VARCHAR(36),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_email (user_email),
        INDEX idx_folder_id (folder_id),
        INDEX idx_type (type),
        INDEX idx_deleted (deleted)
    ) $charset;");

    update_option('keeping_version', KEEPING_VERSION);
}

// ================================
// VERIFICAÇÃO DE API KEY
// ================================
function keeping_verify_api_key() {
    $headers = getallheaders();
    $api_key = isset($headers['X-API-Key']) ? $headers['X-API-Key'] : 
               (isset($headers['x-api-key']) ? $headers['x-api-key'] : null);
    
    if ($api_key !== KEEPING_API_KEY) {
        return new WP_Error('unauthorized', 'Invalid API Key', ['status' => 401]);
    }
    
    // Retorna o user_email do request se disponível
    $request_body = json_decode(file_get_contents('php://input'), true);
    $user_email = isset($request_body['user_email']) ? $request_body['user_email'] : 
                  (isset($_GET['user_email']) ? $_GET['user_email'] : null);
    
    return $user_email;
}

// ================================
// HELPER: GERAR UUID
// ================================
function keeping_generate_uuid() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

// ================================
// CRIAR DADOS DE EXEMPLO PARA NOVO USUÁRIO
// ================================
function keeping_ensure_user_has_data($user_email) {
    global $wpdb;
    $prefix = $wpdb->prefix . KEEPING_PREFIX;
    
    // Verificar se o usuário já tem dados
    $has_data = $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM (
            SELECT id FROM {$prefix}folders WHERE user_email = %s
            UNION ALL
            SELECT id FROM {$prefix}files WHERE user_email = %s
        ) as combined",
        $user_email, $user_email
    ));
    
    if ($has_data > 0) {
        return; // Usuário já tem dados
    }
    
    // Criar pasta de exemplo
    $folder_id = keeping_generate_uuid();
    $wpdb->insert($prefix . 'folders', [
        'id' => $folder_id,
        'user_email' => $user_email,
        'name' => '📁 Bem-vindo ao Keeping',
        'parent_id' => null,
        'color' => '#3b82f6',
        'order' => 0,
        'created_at' => current_time('mysql'),
        'updated_at' => current_time('mysql'),
    ]);
    
    // Criar arquivos de exemplo
    $examples = [
        [
            'name' => '📋 Quadro Kanban', 
            'type' => 'kbn', 
            'content' => json_encode([
                'columns' => [
                    [
                        'id' => '1',
                        'name' => '📝 A Fazer',
                        'cards' => [
                            [
                                'id' => '1',
                                'title' => 'Bem-vindo ao Keeping!',
                                'description' => 'Explore as funcionalidades e crie seus próprios cards',
                                'priority' => 'high'
                            ]
                        ]
                    ],
                    [
                        'id' => '2',
                        'name' => '⚡ Em Progresso',
                        'cards' => []
                    ],
                    [
                        'id' => '3',
                        'name' => '✅ Concluído',
                        'cards' => []
                    ]
                ]
            ])
        ],
        [
            'name' => '📊 Cronograma Gantt', 
            'type' => 'gnt', 
            'content' => json_encode([
                'tasks' => [
                    [
                        'id' => '1',
                        'name' => 'Fase 1: Planejamento',
                        'start' => date('Y-m-d'),
                        'end' => date('Y-m-d', strtotime('+7 days')),
                        'status' => 'inProgress',
                        'progress' => 30
                    ]
                ]
            ])
        ],
        [
            'name' => '📅 Timeline', 
            'type' => 'crn', 
            'content' => json_encode([
                'groups' => [
                    [
                        'id' => '1',
                        'name' => 'Projeto Exemplo',
                        'color' => 'blue'
                    ]
                ],
                'items' => []
            ])
        ],
        [
            'name' => '🗺️ Fluxograma', 
            'type' => 'flux', 
            'content' => json_encode([
                'drawflow' => [
                    'Home' => [
                        'data' => []
                    ]
                ]
            ])
        ],
        [
            'name' => '📄 Documento de Boas-vindas', 
            'type' => 'docx', 
            'content' => '<h1>Bem-vindo ao Keeping! 🎉</h1><p>Este é um documento de exemplo. Você pode editá-lo livremente.</p><p><strong>Dica:</strong> Use a barra de ferramentas para formatar seu texto!</p>'
        ],
        [
            'name' => '📊 Planilha de Exemplo', 
            'type' => 'xlsx', 
            'content' => ''
        ]
    ];
    
    foreach ($examples as $i => $example) {
        $wpdb->insert($prefix . 'files', [
            'id' => keeping_generate_uuid(),
            'user_email' => $user_email,
            'name' => $example['name'],
            'type' => $example['type'],
            'folder_id' => $folder_id,
            'content' => $example['content'],
            'order' => $i,
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql'),
        ]);
    }
}

// ================================
// ROTAS DA API - FOLDERS
// ================================
add_action('rest_api_init', function() {
    // Listar pastas
    register_rest_route('keeping/v1', '/folders', [
        'methods' => 'GET',
        'callback' => 'keeping_get_folders',
        'permission_callback' => '__return_true',
    ]);

    // Criar pasta
    register_rest_route('keeping/v1', '/folders', [
        'methods' => 'POST',
        'callback' => 'keeping_create_folder',
        'permission_callback' => '__return_true',
    ]);

    // Atualizar pasta
    register_rest_route('keeping/v1', '/folders/(?P<id>[a-zA-Z0-9-]+)', [
        'methods' => 'PUT',
        'callback' => 'keeping_update_folder',
        'permission_callback' => '__return_true',
    ]);

    // Deletar pasta
    register_rest_route('keeping/v1', '/folders/(?P<id>[a-zA-Z0-9-]+)', [
        'methods' => 'DELETE',
        'callback' => 'keeping_delete_folder',
        'permission_callback' => '__return_true',
    ]);
});

function keeping_get_folders($request) {
    $auth = keeping_verify_api_key();
    if (is_wp_error($auth)) return $auth;

    global $wpdb;
    $table = $wpdb->prefix . KEEPING_PREFIX . 'folders';
    $user_email = $request->get_param('user_email');
    
    if (!$user_email) {
        return new WP_Error('missing_param', 'user_email is required', ['status' => 400]);
    }

    // Criar dados de exemplo se o usuário não tiver nenhum dado
    keeping_ensure_user_has_data($user_email);

    $folders = $wpdb->get_results($wpdb->prepare(
        "SELECT * FROM $table WHERE user_email = %s ORDER BY \`order\` ASC",
        $user_email
    ), ARRAY_A);

    return rest_ensure_response($folders);
}

function keeping_create_folder($request) {
    $auth = keeping_verify_api_key();
    if (is_wp_error($auth)) return $auth;

    global $wpdb;
    $table = $wpdb->prefix . KEEPING_PREFIX . 'folders';
    $data = $request->get_json_params();

    if (!isset($data['user_email']) || !isset($data['name'])) {
        return new WP_Error('missing_param', 'user_email and name are required', ['status' => 400]);
    }

    $folder = [
        'id' => keeping_generate_uuid(),
        'user_email' => $data['user_email'],
        'name' => $data['name'],
        'parent_id' => isset($data['parent_id']) ? $data['parent_id'] : null,
        'icon' => isset($data['icon']) ? $data['icon'] : null,
        'color' => isset($data['color']) ? $data['color'] : null,
        'order' => isset($data['order']) ? intval($data['order']) : 0,
        'created_at' => current_time('mysql'),
        'updated_at' => current_time('mysql'),
    ];

    $wpdb->insert($table, $folder);
    
    return rest_ensure_response($folder);
}

function keeping_update_folder($request) {
    $auth = keeping_verify_api_key();
    if (is_wp_error($auth)) return $auth;

    global $wpdb;
    $table = $wpdb->prefix . KEEPING_PREFIX . 'folders';
    $id = $request->get_param('id');
    $data = $request->get_json_params();

    $update_data = ['updated_at' => current_time('mysql')];
    
    if (isset($data['name'])) $update_data['name'] = $data['name'];
    if (isset($data['parent_id'])) $update_data['parent_id'] = $data['parent_id'];
    if (isset($data['icon'])) $update_data['icon'] = $data['icon'];
    if (isset($data['color'])) $update_data['color'] = $data['color'];
    if (isset($data['order'])) $update_data['order'] = intval($data['order']);
    if (isset($data['deleted'])) $update_data['deleted'] = $data['deleted'] ? 1 : 0;
    if (isset($data['deleted_at'])) $update_data['deleted_at'] = $data['deleted_at'];
    if (isset($data['original_parent_id'])) $update_data['original_parent_id'] = $data['original_parent_id'];

    $wpdb->update($table, $update_data, ['id' => $id]);
    
    $folder = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id = %s", $id), ARRAY_A);
    
    return rest_ensure_response($folder);
}

function keeping_delete_folder($request) {
    $auth = keeping_verify_api_key();
    if (is_wp_error($auth)) return $auth;

    global $wpdb;
    $table = $wpdb->prefix . KEEPING_PREFIX . 'folders';
    $id = $request->get_param('id');

    $wpdb->delete($table, ['id' => $id]);
    
    return rest_ensure_response(['success' => true]);
}

// ================================
// ROTAS DA API - FILES
// ================================
add_action('rest_api_init', function() {
    // Listar arquivos
    register_rest_route('keeping/v1', '/files', [
        'methods' => 'GET',
        'callback' => 'keeping_get_files',
        'permission_callback' => '__return_true',
    ]);

    // Criar arquivo
    register_rest_route('keeping/v1', '/files', [
        'methods' => 'POST',
        'callback' => 'keeping_create_file',
        'permission_callback' => '__return_true',
    ]);

    // Atualizar arquivo
    register_rest_route('keeping/v1', '/files/(?P<id>[a-zA-Z0-9-]+)', [
        'methods' => 'PUT',
        'callback' => 'keeping_update_file',
        'permission_callback' => '__return_true',
    ]);

    // Deletar arquivo
    register_rest_route('keeping/v1', '/files/(?P<id>[a-zA-Z0-9-]+)', [
        'methods' => 'DELETE',
        'callback' => 'keeping_delete_file',
        'permission_callback' => '__return_true',
    ]);
});

function keeping_get_files($request) {
    $auth = keeping_verify_api_key();
    if (is_wp_error($auth)) return $auth;

    global $wpdb;
    $table = $wpdb->prefix . KEEPING_PREFIX . 'files';
    $user_email = $request->get_param('user_email');
    
    if (!$user_email) {
        return new WP_Error('missing_param', 'user_email is required', ['status' => 400]);
    }

    // Criar dados de exemplo se o usuário não tiver nenhum dado
    keeping_ensure_user_has_data($user_email);

    $files = $wpdb->get_results($wpdb->prepare(
        "SELECT * FROM $table WHERE user_email = %s ORDER BY \`order\` ASC",
        $user_email
    ), ARRAY_A);

    return rest_ensure_response($files);
}

function keeping_create_file($request) {
    $auth = keeping_verify_api_key();
    if (is_wp_error($auth)) return $auth;

    global $wpdb;
    $table = $wpdb->prefix . KEEPING_PREFIX . 'files';
    $data = $request->get_json_params();

    if (!isset($data['user_email']) || !isset($data['name']) || !isset($data['type'])) {
        return new WP_Error('missing_param', 'user_email, name and type are required', ['status' => 400]);
    }

    $file = [
        'id' => keeping_generate_uuid(),
        'user_email' => $data['user_email'],
        'name' => $data['name'],
        'type' => $data['type'],
        'folder_id' => isset($data['folder_id']) ? $data['folder_id'] : null,
        'content' => isset($data['content']) ? $data['content'] : null,
        'file_url' => isset($data['file_url']) ? $data['file_url'] : null,
        'order' => isset($data['order']) ? intval($data['order']) : 0,
        'created_at' => current_time('mysql'),
        'updated_at' => current_time('mysql'),
    ];

    $wpdb->insert($table, $file);
    
    return rest_ensure_response($file);
}

function keeping_update_file($request) {
    $auth = keeping_verify_api_key();
    if (is_wp_error($auth)) return $auth;

    global $wpdb;
    $table = $wpdb->prefix . KEEPING_PREFIX . 'files';
    $id = $request->get_param('id');
    $data = $request->get_json_params();

    $update_data = ['updated_at' => current_time('mysql')];
    
    if (isset($data['name'])) $update_data['name'] = $data['name'];
    if (isset($data['folder_id'])) $update_data['folder_id'] = $data['folder_id'];
    if (isset($data['content'])) $update_data['content'] = $data['content'];
    if (isset($data['file_url'])) $update_data['file_url'] = $data['file_url'];
    if (isset($data['order'])) $update_data['order'] = intval($data['order']);
    if (isset($data['deleted'])) $update_data['deleted'] = $data['deleted'] ? 1 : 0;
    if (isset($data['deleted_at'])) $update_data['deleted_at'] = $data['deleted_at'];
    if (isset($data['original_folder_id'])) $update_data['original_folder_id'] = $data['original_folder_id'];

    $wpdb->update($table, $update_data, ['id' => $id]);
    
    $file = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id = %s", $id), ARRAY_A);
    
    return rest_ensure_response($file);
}

function keeping_delete_file($request) {
    $auth = keeping_verify_api_key();
    if (is_wp_error($auth)) return $auth;

    global $wpdb;
    $table = $wpdb->prefix . KEEPING_PREFIX . 'files';
    $id = $request->get_param('id');

    $wpdb->delete($table, ['id' => $id]);
    
    return rest_ensure_response(['success' => true]);
}

// ================================
// PÁGINA DE ADMINISTRAÇÃO
// ================================
add_action('admin_menu', 'keeping_add_admin_menu');

function keeping_add_admin_menu() {
    add_menu_page(
        'Keeping Database',
        'Keeping DB',
        'manage_options',
        'keeping-database',
        'keeping_admin_page',
        'dashicons-database',
        30
    );
}

function keeping_admin_page() {
    global $wpdb;
    $folders_table = $wpdb->prefix . KEEPING_PREFIX . 'folders';
    $files_table = $wpdb->prefix . KEEPING_PREFIX . 'files';
    
    // Get selected user
    $selected_user = isset($_GET['user']) ? sanitize_email($_GET['user']) : null;
    
    // Get all unique users
    $users = $wpdb->get_results("
        SELECT DISTINCT user_email, 
               COUNT(*) as total_items,
               MAX(created_at) as last_activity
        FROM (
            SELECT user_email, created_at FROM $folders_table
            UNION ALL
            SELECT user_email, created_at FROM $files_table
        ) as combined
        GROUP BY user_email
        ORDER BY last_activity DESC
    ");
    
    ?>
    <div class="wrap">
        <h1>🗄️ Keeping Database Manager</h1>
        <p>Visualize e gerencie os dados dos usuários do Keeping</p>
        
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin: 0 0 10px 0; color: #856404;">🔑 API Key do Plugin</h3>
            <p style="margin: 0 0 10px 0; color: #856404;">
                Copie esta chave e cole na aba <strong>Configuração</strong> do app:
            </p>
            <div style="background: white; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 16px; font-weight: bold; color: #d63384; border: 2px dashed #ffc107; display: flex; align-items: center; justify-content: space-between;">
                <span id="api-key-value"><?php echo KEEPING_API_KEY; ?></span>
                <button onclick="copyApiKey()" class="button button-secondary" style="margin-left: 10px;">
                    📋 Copiar
                </button>
            </div>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #856404;">
                ⚠️ Mantenha esta chave em segredo. Para alterar, edite a linha 11 do arquivo PHP do plugin.
            </p>
        </div>
        
        <script>
        function copyApiKey() {
            const apiKey = document.getElementById('api-key-value').innerText;
            navigator.clipboard.writeText(apiKey).then(function() {
                alert('✓ API Key copiada para a área de transferência!');
            });
        }
        </script>
        
        <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h2>📊 Estatísticas Gerais</h2>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 15px;">
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 32px; font-weight: bold; color: #1976d2;">
                        <?php echo count($users); ?>
                    </div>
                    <div style="color: #555; margin-top: 5px;">Usuários Ativos</div>
                </div>
                <div style="background: #f3e5f5; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 32px; font-weight: bold; color: #7b1fa2;">
                        <?php echo $wpdb->get_var("SELECT COUNT(*) FROM $folders_table"); ?>
                    </div>
                    <div style="color: #555; margin-top: 5px;">Total de Pastas</div>
                </div>
                <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 32px; font-weight: bold; color: #388e3c;">
                        <?php echo $wpdb->get_var("SELECT COUNT(*) FROM $files_table"); ?>
                    </div>
                    <div style="color: #555; margin-top: 5px;">Total de Arquivos</div>
                </div>
            </div>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h2>👥 Usuários do Keeping</h2>
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Total de Itens</th>
                        <th>Última Atividade</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($users as $user): ?>
                    <tr>
                        <td><strong><?php echo esc_html($user->user_email); ?></strong></td>
                        <td><?php echo $user->total_items; ?> itens</td>
                        <td><?php echo date('d/m/Y H:i', strtotime($user->last_activity)); ?></td>
                        <td>
                            <a href="?page=keeping-database&user=<?php echo urlencode($user->user_email); ?>" class="button button-primary">
                                Ver Dados
                            </a>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        
        <?php if ($selected_user): ?>
        <div style="background: white; padding: 20px; margin-top: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h2>📂 Dados de: <?php echo esc_html($selected_user); ?></h2>
            
            <h3 style="margin-top: 20px;">Pastas (<?php echo $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $folders_table WHERE user_email = %s", $selected_user)); ?>)</h3>
            <?php
            $folders = $wpdb->get_results($wpdb->prepare(
                "SELECT * FROM $folders_table WHERE user_email = %s ORDER BY created_at DESC LIMIT 50",
                $selected_user
            ));
            ?>
            <table class="wp-list-table widefat fixed striped" style="margin-top: 10px;">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nome</th>
                        <th>Pasta Pai</th>
                        <th>Cor</th>
                        <th>Ordem</th>
                        <th>Deletado</th>
                        <th>Criado em</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($folders as $folder): ?>
                    <tr>
                        <td><code><?php echo esc_html(substr($folder->id, 0, 8)); ?>...</code></td>
                        <td><strong><?php echo esc_html($folder->name); ?></strong></td>
                        <td><?php echo $folder->parent_id ? esc_html(substr($folder->parent_id, 0, 8)) . '...' : '-'; ?></td>
                        <td>
                            <?php if ($folder->color): ?>
                            <span style="display: inline-block; width: 20px; height: 20px; background: <?php echo esc_attr($folder->color); ?>; border-radius: 4px; vertical-align: middle;"></span>
                            <?php else: ?>
                            -
                            <?php endif; ?>
                        </td>
                        <td><?php echo $folder->order; ?></td>
                        <td><?php echo $folder->deleted ? '🗑️ Sim' : '✅ Não'; ?></td>
                        <td><?php echo date('d/m/Y H:i', strtotime($folder->created_at)); ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            
            <h3 style="margin-top: 30px;">Arquivos (<?php echo $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $files_table WHERE user_email = %s", $selected_user)); ?>)</h3>
            <?php
            $files = $wpdb->get_results($wpdb->prepare(
                "SELECT * FROM $files_table WHERE user_email = %s ORDER BY created_at DESC LIMIT 50",
                $selected_user
            ));
            ?>
            <table class="wp-list-table widefat fixed striped" style="margin-top: 10px;">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nome</th>
                        <th>Tipo</th>
                        <th>Pasta</th>
                        <th>Tamanho do Conteúdo</th>
                        <th>Deletado</th>
                        <th>Criado em</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($files as $file): ?>
                    <tr>
                        <td><code><?php echo esc_html(substr($file->id, 0, 8)); ?>...</code></td>
                        <td><strong><?php echo esc_html($file->name); ?></strong></td>
                        <td><span style="background: #e3f2fd; padding: 3px 8px; border-radius: 4px; font-size: 11px;"><?php echo strtoupper($file->type); ?></span></td>
                        <td><?php echo $file->folder_id ? esc_html(substr($file->folder_id, 0, 8)) . '...' : 'Raiz'; ?></td>
                        <td><?php echo $file->content ? number_format(strlen($file->content) / 1024, 2) . ' KB' : '0 KB'; ?></td>
                        <td><?php echo $file->deleted ? '🗑️ Sim' : '✅ Não'; ?></td>
                        <td><?php echo date('d/m/Y H:i', strtotime($file->created_at)); ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            
            <p style="margin-top: 15px;">
                <a href="?page=keeping-database" class="button">← Voltar para lista de usuários</a>
            </p>
        </div>
        <?php endif; ?>
    </div>
    <?php
}

// ================================
// INFO DO PLUGIN (público - sem auth)
// ================================
add_action('rest_api_init', function() {
    register_rest_route('keeping/v1', '/info', [
        'methods' => 'GET',
        'callback' => function() {
            return rest_ensure_response([
                'plugin' => 'Keeping Database API',
                'version' => KEEPING_VERSION,
                'wordpress_version' => get_bloginfo('version'),
                'php_version' => phpversion(),
                'status' => 'active'
            ]);
        },
        'permission_callback' => '__return_true',
    ]);
});

// ================================
// TESTE DE CONEXÃO (com auth)
// ================================
add_action('rest_api_init', function() {
    register_rest_route('keeping/v1', '/test', [
        'methods' => 'GET',
        'callback' => function() {
            $auth = keeping_verify_api_key();
            if (is_wp_error($auth)) return $auth;
            
            return rest_ensure_response([
                'success' => true,
                'message' => 'API Key válida! Conexão estabelecida com sucesso.',
                'user_email' => $auth
            ]);
        },
        'permission_callback' => '__return_true',
    ]);
});`;

  const handleCopy = () => {
    navigator.clipboard.writeText(phpPlugin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([phpPlugin], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'keeping-database-api.php';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <Link to={createPageUrl('Wiki')}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Wiki
            </Button>
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center">
              <Code className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Documentação para Desenvolvedores</h1>
              <p className="text-gray-600">Integração WordPress e informações técnicas</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="plugin">Plugin PHP</TabsTrigger>
              <TabsTrigger value="api">API Reference</TabsTrigger>
              <TabsTrigger value="setup">Instalação</TabsTrigger>
              <TabsTrigger value="config">Configuração</TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Arquitetura do Sistema</h2>
                <p className="text-gray-700 mb-4">
                  O Keeping utiliza uma arquitetura híbrida com banco de dados distribuído:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <Database className="w-8 h-8 text-blue-600 mb-2" />
                    <h3 className="font-semibold mb-2">Base44 Database</h3>
                    <p className="text-sm text-gray-600">
                      Gerencia autenticação de usuários e configurações do sistema
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <Server className="w-8 h-8 text-purple-600 mb-2" />
                    <h3 className="font-semibold mb-2">WordPress Database</h3>
                    <p className="text-sm text-gray-600">
                      Armazena dados de arquivos e pastas isolados por usuário
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Tecnologias Utilizadas</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li><strong>Frontend:</strong> React, Tailwind CSS, TypeScript</li>
                  <li><strong>Backend:</strong> Base44 BaaS + WordPress REST API</li>
                  <li><strong>Autenticação:</strong> Base44 Auth System</li>
                  <li><strong>Storage:</strong> Base44 + Supabase Storage</li>
                  <li><strong>API:</strong> REST API com autenticação por API Key</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Fluxo de Dados</h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <ol className="list-decimal list-inside space-y-3 text-gray-700">
                    <li>Usuário faz login via Base44 Auth</li>
                    <li>Frontend recebe email do usuário autenticado</li>
                    <li>Todas as requisições ao WordPress incluem user_email e API Key</li>
                    <li>Plugin WordPress filtra dados por user_email</li>
                    <li>Dados isolados garantem privacidade e segurança</li>
                  </ol>
                </div>
              </div>
            </TabsContent>

            {/* Plugin PHP */}
            <TabsContent value="plugin" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Plugin WordPress</h2>
                <div className="flex gap-2">
                  <Button onClick={handleCopy} variant="outline">
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? 'Copiado!' : 'Copiar'}
                  </Button>
                  <Button onClick={handleDownload} className="bg-purple-600 hover:bg-purple-700">
                    <Download className="w-4 h-4 mr-2" />
                    Download PHP
                  </Button>
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-6 overflow-x-auto">
                <pre className="text-sm text-green-400 font-mono whitespace-pre">
                  <code>{phpPlugin}</code>
                </pre>
              </div>
            </TabsContent>

            {/* API Reference */}
            <TabsContent value="api" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">API Endpoints</h2>
                
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">GET</span>
                      <code className="text-sm">/wp-json/keeping/v1/folders</code>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Lista todas as pastas do usuário</p>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-xs font-semibold mb-1">Query Params:</p>
                      <code className="text-xs">?user_email=user@example.com</code>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">POST</span>
                      <code className="text-sm">/wp-json/keeping/v1/folders</code>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Cria uma nova pasta</p>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-xs font-semibold mb-1">Body (JSON):</p>
                      <pre className="text-xs">{JSON.stringify({
                        user_email: "user@example.com",
                        name: "Minha Pasta",
                        parent_id: null,
                        color: "#3b82f6"
                      }, null, 2)}</pre>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold">PUT</span>
                      <code className="text-sm">/wp-json/keeping/v1/folders/:id</code>
                    </div>
                    <p className="text-sm text-gray-600">Atualiza uma pasta existente</p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold">DELETE</span>
                      <code className="text-sm">/wp-json/keeping/v1/folders/:id</code>
                    </div>
                    <p className="text-sm text-gray-600">Deleta uma pasta</p>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-xl font-bold mb-3">Files API</h3>
                  <p className="text-gray-600 mb-3">Os mesmos endpoints existem para /files com estrutura similar</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                    <li>GET /wp-json/keeping/v1/files</li>
                    <li>POST /wp-json/keeping/v1/files</li>
                    <li>PUT /wp-json/keeping/v1/files/:id</li>
                    <li>DELETE /wp-json/keeping/v1/files/:id</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-3">Autenticação</h3>
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4">
                  <div className="flex items-start gap-2">
                    <Key className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-900">API Key Obrigatória</p>
                      <p className="text-sm text-amber-800 mt-1">
                        Todas as requisições devem incluir o header:
                      </p>
                      <code className="block bg-amber-100 p-2 rounded mt-2 text-xs">
                        X-API-Key: kp_live_7f8a9b2c4d6e1f3a5b7c9d2e4f6a8b0c...
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Setup */}
            <TabsContent value="setup" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Instalação do Plugin</h2>
                <ol className="list-decimal list-inside space-y-3 text-gray-700 ml-4">
                  <li>
                    <strong>Download:</strong> Baixe o arquivo PHP usando o botão na aba "Plugin PHP"
                  </li>
                  <li>
                    <strong>Upload:</strong> Acesse WordPress Admin → Plugins → Add New → Upload Plugin
                  </li>
                  <li>
                    <strong>Ativar:</strong> Ative o plugin "Keeping Database API"
                  </li>
                  <li>
                    <strong>Verificar:</strong> As tabelas serão criadas automaticamente
                  </li>
                </ol>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Configuração da API Key</h2>
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                  <p className="font-semibold text-red-900">⚠️ IMPORTANTE - Segurança</p>
                  <p className="text-sm text-red-800 mt-1">
                    Altere a API_KEY no arquivo PHP antes de usar em produção!
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-semibold mb-2">Linha 11 do plugin:</p>
                  <code className="text-xs block bg-white p-2 rounded">
                    define('KEEPING_API_KEY', '<span className="text-red-600">kp_live_SuaChaveSecretaAqui123456789</span>');
                  </code>
                  <p className="text-xs text-gray-600 mt-2">💡 A chave já vem gerada no plugin, mas você pode alterá-la para uma personalizada se desejar.</p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Testando a Instalação</h2>
                <p className="text-gray-700 mb-3">Teste se o plugin está funcionando:</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-semibold mb-2">Acesse no navegador:</p>
                  <code className="text-xs block bg-white p-2 rounded mb-3">
                    https://seu-site.com/wp-json/keeping/v1/info
                  </code>
                  <p className="text-sm font-semibold mb-2">Resposta esperada:</p>
                  <pre className="text-xs bg-white p-2 rounded">{JSON.stringify({
                    "plugin": "Keeping Database API",
                    "version": "1.0.0",
                    "wordpress_version": "6.4",
                    "php_version": "8.1",
                    "status": "active"
                  }, null, 2)}</pre>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Requisitos do Sistema</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>WordPress 5.0 ou superior</li>
                  <li>PHP 7.4 ou superior</li>
                  <li>MySQL 5.7 ou superior</li>
                  <li>Permissão para criar tabelas no banco</li>
                  <li>mod_rewrite habilitado (permalinks)</li>
                </ul>
              </div>
            </TabsContent>

            {/* Configuração */}
            <TabsContent value="config" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">⚙️ Configurar Conexão WordPress</h2>
                <p className="text-gray-700 mb-6">
                  Configure a URL do seu WordPress e a API Key para conectar o app ao banco de dados.
                </p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      URL do WordPress
                    </label>
                    <Input
                      type="url"
                      value={wpUrl}
                      onChange={(e) => setWpUrl(e.target.value)}
                      placeholder="https://toothsomeservant.s2-tastewp.com"
                      className="text-lg"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Cole a URL completa do seu site WordPress (sem barra no final)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      API Key
                    </label>
                    <Input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="kp_live_7f8a9b2c4d6e1f3a5b7c9d2e..."
                      className="text-lg font-mono"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Copie a chave exibida no painel do WordPress (página Keeping DB)
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleTestConnection}
                      disabled={!wpUrl || !apiKey || testing}
                      variant="outline"
                      className="flex-1"
                    >
                      {testing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Database className="w-4 h-4 mr-2" />
                      )}
                      Testar Conexão
                    </Button>
                    <Button
                      onClick={handleSaveConfig}
                      disabled={!wpUrl || !apiKey || updateSettingsMutation.isLoading}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      {updateSettingsMutation.isLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Salvar Configurações
                    </Button>
                  </div>

                  {testStatus && (
                    <div className={`p-4 rounded-lg border-l-4 ${
                      testStatus.success 
                        ? 'bg-green-50 border-green-500' 
                        : 'bg-red-50 border-red-500'
                    }`}>
                      <div className="flex items-start gap-3">
                        {testStatus.success ? (
                          <Check className="w-5 h-5 text-green-600 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className={`font-semibold ${
                            testStatus.success ? 'text-green-900' : 'text-red-900'
                          }`}>
                            {testStatus.success ? '✓ Conexão bem-sucedida!' : '✗ Falha na conexão'}
                          </p>
                          {testStatus.success ? (
                           <div className="mt-2 text-sm text-green-800 space-y-1">
                             <p>{testStatus.data.message}</p>
                             <p className="mt-3 text-green-700 font-semibold">
                               ✅ O app está pronto para salvar e editar dados no WordPress!
                             </p>
                           </div>
                          ) : (
                           <p className="text-sm text-red-800 mt-1">{testStatus.error}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold mb-3">📋 Checklist de Configuração</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">1.</span>
                    <span>Instale o plugin PHP no WordPress</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">2.</span>
                    <span>Ative o plugin no painel administrativo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">3.</span>
                    <span>Cole a URL do WordPress no campo acima</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">4.</span>
                    <span>Cole a API Key (mesma do plugin)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">5.</span>
                    <span>Clique em "Testar Conexão"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">6.</span>
                    <span>Se OK, clique em "Salvar Configurações"</span>
                  </li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}