export function getAppJS2(): string {
  return `
    function AgentCard({ agent, onToggle, onEdit, onDelete, onRun }) {
      const [running, setRunning] = useState(false);

      const handleRun = async () => {
        setRunning(true);
        await onRun(agent);
        setRunning(false);
      };

      return React.createElement('div', {
        style: {
          background: '#13131a', border: \`1px solid \${agent.enabled ? 'rgba(99,102,241,0.25)' : '#1e1e2e'}\`,
          borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 14,
          transition: 'border-color 0.2s'
        }
      },
        React.createElement('div', { style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 } },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 } },
            React.createElement('div', {
              style: {
                width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }
            }, React.createElement(Bot, { size: 18, color: '#6366f1' })),
            React.createElement('div', { style: { minWidth: 0 } },
              React.createElement('div', { style: { fontWeight: 700, fontSize: 14, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, agent.name),
              React.createElement(Badge, { label: agent.workspace, variant: agent.workspace === 'marketing' ? 'default' : 'warning' })
            )
          ),
          React.createElement(Toggle, { value: !!agent.enabled, onChange: (v) => onToggle(agent.id, v ? 1 : 0) })
        ),

        agent.description && React.createElement('p', { style: { fontSize: 13, color: '#94a3b8', lineHeight: 1.5, margin: 0 } },
          agent.description.length > 120 ? agent.description.slice(0, 120) + '...' : agent.description
        ),

        parseTools(agent.tools).length > 0 && React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 5 } },
          React.createElement('span', { style: { fontSize: 11, color: '#64748b', marginRight: 3, alignSelf: 'center' } }, 'Tools:'),
          parseTools(agent.tools).map(t =>
            React.createElement('span', {
              key: t,
              style: {
                fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 5,
                background: 'rgba(99,102,241,0.12)', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.03em'
              }
            }, t)
          )
        ),

        React.createElement('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
          React.createElement(Btn, { onClick: handleRun, variant: 'primary', size: 'sm', disabled: running },
            running ? React.createElement(Spinner, { size: 11, color: '#fff' }) : React.createElement(Play, { size: 12 }),
            running ? 'Running...' : 'Run'
          ),
          React.createElement(Btn, { onClick: () => onEdit(agent), variant: 'ghost', size: 'sm' },
            React.createElement(Edit, { size: 12 }), 'Edit'
          ),
          React.createElement(Btn, { onClick: () => onDelete(agent.id), variant: 'danger', size: 'sm' },
            React.createElement(Trash2, { size: 12 }), 'Delete'
          )
        )
      );
    }


    function AgentBuilderModal({ agent, onSave, onClose }) {
      const [form, setForm] = useState({
        name: agent?.name || '',
        workspace: agent?.workspace || 'marketing',
        description: agent?.description || '',
        system_prompt: agent?.system_prompt || '',
        tools: parseTools(agent?.tools),
        model: agent?.model || 'claude-sonnet-4-6',
      });
      const [saving, setSaving] = useState(false);

      const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));
      const toggleTool = (t) => setField('tools', form.tools.includes(t) ? form.tools.filter(x => x !== t) : [...form.tools, t]);

      const handleSave = async () => {
        if (!form.name.trim()) return;
        setSaving(true);
        await onSave({ ...form, id: agent?.id });
        setSaving(false);
        onClose();
      };

      return React.createElement('div', {
        className: 'modal-overlay',
        style: {
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        },
        onClick: e => e.target === e.currentTarget && onClose()
      },
        React.createElement('div', {
          className: 'modal-card',
          style: {
            background: '#13131a', border: '1px solid #1e1e2e', borderRadius: 18,
            width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: 0
          }
        },
          React.createElement('div', { style: { padding: '22px 24px', borderBottom: '1px solid #1e1e2e', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
            React.createElement('div', null,
              React.createElement('h2', { style: { fontSize: 18, fontWeight: 700, color: '#e2e8f0' } }, agent ? 'Edit Agent' : 'Create Agent'),
              React.createElement('p', { style: { color: '#64748b', fontSize: 12, marginTop: 2 } }, 'Configure your AI agent')
            ),
            React.createElement('button', {
              onClick: onClose,
              style: { background: '#1e1e2e', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: '#64748b', display: 'flex' }
            }, React.createElement(X, { size: 16 }))
          ),
          React.createElement('div', { style: { padding: 24, display: 'flex', flexDirection: 'column', gap: 20 } },
            React.createElement(Input, { label: 'Agent Name', value: form.name, onChange: v => setField('name', v), placeholder: 'My Marketing Agent' }),

            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
              React.createElement('label', { style: { fontSize: 12, fontWeight: 500, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' } }, 'Workspace'),
              React.createElement('div', { style: { display: 'flex', gap: 10 } },
                ['marketing', 'sales'].map(w =>
                  React.createElement('button', {
                    key: w, onClick: () => setField('workspace', w),
                    style: {
                      flex: 1, padding: '10px 16px', borderRadius: 9, border: \`1px solid \${form.workspace === w ? '#6366f1' : '#1e1e2e'}\`,
                      background: form.workspace === w ? 'rgba(99,102,241,0.15)' : '#0a0a0f',
                      color: form.workspace === w ? '#6366f1' : '#64748b',
                      cursor: 'pointer', fontSize: 13, fontWeight: 500, textTransform: 'capitalize', transition: 'all 0.15s'
                    }
                  }, w)
                )
              )
            ),

            React.createElement(Textarea, { label: 'Description', value: form.description, onChange: v => setField('description', v), placeholder: 'Briefly describe what this agent does...', rows: 2 }),
            React.createElement(Textarea, { label: 'System Prompt', value: form.system_prompt, onChange: v => setField('system_prompt', v), placeholder: 'You are a helpful marketing assistant...', rows: 6 }),

            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
              React.createElement('label', { style: { fontSize: 12, fontWeight: 500, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' } }, 'Tools'),
              React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 } },
                ALL_TOOLS.map(t =>
                  React.createElement('label', {
                    key: t,
                    style: {
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                      borderRadius: 8, border: \`1px solid \${form.tools.includes(t) ? '#6366f1' : '#1e1e2e'}\`,
                      background: form.tools.includes(t) ? 'rgba(99,102,241,0.1)' : '#0a0a0f',
                      cursor: 'pointer', transition: 'all 0.15s', fontSize: 13
                    }
                  },
                    React.createElement('input', {
                      type: 'checkbox', checked: form.tools.includes(t), onChange: () => toggleTool(t),
                      style: { accentColor: '#6366f1', width: 14, height: 14 }
                    }),
                    React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: 5 } },
                      React.createElement(BrandIcon, { slug: INTEGRATION_META[t]?.icon || t, color: INTEGRATION_META[t]?.color || '#6366f1', size: 12, bare: true }),
                      t
                    )
                  )
                )
              )
            ),

            React.createElement(Input, { label: 'Model', value: form.model, onChange: v => setField('model', v), placeholder: 'claude-sonnet-4-6' })
          ),
          React.createElement('div', { style: { padding: '18px 24px', borderTop: '1px solid #1e1e2e', display: 'flex', gap: 10, justifyContent: 'flex-end' } },
            React.createElement(Btn, { onClick: onClose, variant: 'ghost' }, 'Cancel'),
            React.createElement(Btn, { onClick: handleSave, variant: 'primary', disabled: !form.name.trim() || saving },
              saving ? React.createElement(Spinner, { size: 14, color: '#fff' }) : React.createElement(Save, { size: 14 }),
              saving ? 'Saving...' : (agent ? 'Update Agent' : 'Create Agent')
            )
          )
        )
      );
    }


    function AgentStudio({ agents, setAgents, setChatOpen, setChatMessages, showToast }) {
      const [showBuilder, setShowBuilder] = useState(false);
      const [editingAgent, setEditingAgent] = useState(null);

      const marketingAgents = agents.filter(a => a.workspace === 'marketing');
      const salesAgents = agents.filter(a => a.workspace === 'sales');

      const handleSaveAgent = async (form) => {
        try {
          const isEdit = !!form.id;
          const url = isEdit ? \`/api/agents/\${form.id}\` : '/api/agents';
          const method = isEdit ? 'PUT' : 'POST';
          const payload = {
            name: form.name,
            workspace: form.workspace,
            description: form.description,
            system_prompt: form.system_prompt,
            tools: form.tools,
            model: form.model,
          };
          const res = await fetch(url, {
            method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
          });
          if (!res.ok) throw new Error('Failed to save agent');
          const saved = await res.json();
          if (isEdit) {
            setAgents(prev => prev.map(a => a.id === saved.id ? saved : a));
          } else {
            setAgents(prev => [...prev, saved]);
          }
          showToast(isEdit ? 'Agent updated!' : 'Agent created!', 'success');
        } catch (e) {
          showToast('Failed to save agent: ' + e.message, 'error');
        }
      };

      const handleToggle = async (id, enabled) => {
        try {
          const res = await fetch(\`/api/agents/\${id}\`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled })
          });
          if (!res.ok) throw new Error();
          setAgents(prev => prev.map(a => a.id === id ? { ...a, enabled } : a));
        } catch {
          showToast('Failed to update agent', 'error');
        }
      };

      const handleDelete = async (id) => {
        if (!confirm('Delete this agent?')) return;
        try {
          const res = await fetch(\`/api/agents/\${id}\`, { method: 'DELETE' });
          if (!res.ok) throw new Error();
          setAgents(prev => prev.filter(a => a.id !== id));
          showToast('Agent deleted', 'success');
        } catch {
          showToast('Failed to delete agent', 'error');
        }
      };

      const handleRun = async (agent) => {
        const msg = \`Execute your primary task now. \${agent.description || ''}\`.trim();
        const userMsg = { role: 'user', content: \`[\${agent.name}] \${msg}\`, id: Date.now() };
        setChatMessages(prev => [...prev, userMsg]);
        setChatOpen(true);
        try {
          const res = await fetch('/api/chat', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg, agent_id: agent.id, workspace: agent.workspace })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error?.message || data?.error || \`HTTP \${res.status}\`);
          setChatMessages(prev => [...prev, { role: 'assistant', content: data.response, id: Date.now() + 1 }]);
          showToast(\`Agent "\${agent.name}" completed\`, 'success');
        } catch (e) {
          setChatMessages(prev => [...prev, { role: 'assistant', content: \`Error: \${e.message}\`, id: Date.now() + 1, error: true }]);
          showToast(\`Agent "\${agent.name}" failed\`, 'error');
        }
      };

      const openAiCreate = () => {
        setChatMessages(prev => [...prev, {
          role: 'user', content: 'Help me create a new AI agent for my marketing/sales workflow.',
          id: Date.now()
        }]);
        setChatOpen(true);
      };

      const AgentColumn = ({ title, agentList, icon }) =>
        React.createElement('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', gap: 16 } },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 } },
            icon,
            React.createElement('h2', { style: { fontSize: 15, fontWeight: 700, color: '#e2e8f0' } }, title),
            React.createElement('span', { style: { fontSize: 12, color: '#64748b', background: '#1e1e2e', padding: '1px 8px', borderRadius: 10 } }, agentList.length)
          ),
          agentList.length === 0
            ? React.createElement('div', {
                style: {
                  background: '#13131a', border: '1px dashed #1e1e2e', borderRadius: 12,
                  padding: 32, textAlign: 'center', color: '#64748b', fontSize: 13
                }
              },
                React.createElement(Bot, { size: 24, style: { margin: '0 auto 10px', opacity: 0.3 } }),
                React.createElement('div', null, 'No agents yet'),
                React.createElement('div', { style: { fontSize: 11, marginTop: 4, color: '#4a5568' } }, 'Create one to get started')
              )
            : agentList.map(agent =>
                React.createElement(AgentCard, {
                  key: agent.id, agent,
                  onToggle: handleToggle,
                  onEdit: (a) => { setEditingAgent(a); setShowBuilder(true); },
                  onDelete: handleDelete,
                  onRun: handleRun
                })
              )
        );

      return React.createElement('div', { style: { padding: 32, maxWidth: 1100, margin: '0 auto' } },
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 } },
          React.createElement('div', null,
            React.createElement('h1', { style: { fontSize: 24, fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.02em' } }, 'Agent Studio'),
            React.createElement('p', { style: { color: '#64748b', fontSize: 13, marginTop: 4 } }, 'Build and manage your AI agents')
          ),
          React.createElement('div', { style: { display: 'flex', gap: 10 } },
            React.createElement(Btn, {
              onClick: openAiCreate, variant: 'ghost',
              style: { border: '1px solid #1e1e2e' }
            },
              React.createElement(Zap, { size: 14, color: '#f59e0b' }), 'Ask AI to create'
            ),
            React.createElement(Btn, {
              onClick: () => { setEditingAgent(null); setShowBuilder(true); }, variant: 'primary'
            },
              React.createElement(Plus, { size: 15 }), 'Create Agent'
            )
          )
        ),

        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 } },
          React.createElement(AgentColumn, {
            title: 'Marketing Agents', agentList: marketingAgents,
            icon: React.createElement(TrendingUp, { size: 15, color: '#10b981' })
          }),
          React.createElement(AgentColumn, {
            title: 'Sales Agents', agentList: salesAgents,
            icon: React.createElement(Briefcase, { size: 15, color: '#8b5cf6' })
          })
        ),

        (showBuilder) && React.createElement(AgentBuilderModal, {
          agent: editingAgent,
          onSave: handleSaveAgent,
          onClose: () => { setShowBuilder(false); setEditingAgent(null); }
        })
      );
    }


    function SettingsPage({ integrations, setIntegrations, llmConfig, setLlmConfig, showToast }) {
      const [llmForm, setLlmForm] = useState({
        provider: llmConfig?.provider || 'anthropic',
        apiKey: llmConfig?.api_key || '',
        model: llmConfig?.model || 'claude-sonnet-4-6',
        endpoint: llmConfig?.endpoint || '',
      });
      const [llmSaving, setLlmSaving] = useState(false);
      const [intFields, setIntFields] = useState(() => {
        const init = {};
        INTEGRATIONS.forEach(name => {
          init[name] = {};
          (INTEGRATION_FIELDS[name] || []).forEach(f => { init[name][f.key] = ''; });
        });
        return init;
      });
      const [intSaving, setIntSaving] = useState({});

      // Pre-populate non-sensitive fields from saved integration data
      useEffect(() => {
        const f = {};
        integrations.forEach(ig => {
          f[ig.name] = {};
          const ec = ig.extra_config || {};
          if (ec.target) f[ig.name].target = ec.target;
          if (ec.property_id) f[ig.name].propertyId = ec.property_id;
          if (ec.site_url) f[ig.name].siteUrl = ec.site_url;
          if (ec.author_id) f[ig.name].authorId = ec.author_id;
          if (ec.client_id) f[ig.name].clientId = ec.client_id;
          if (ec.redirect_uri) f[ig.name].redirectUri = ec.redirect_uri;
        });
        setIntFields(prev => {
          const u = { ...prev };
          Object.keys(f).forEach(n => { u[n] = { ...u[n], ...f[n] }; });
          return u;
        });
      }, [integrations]);

      // Sync LLM form when config loads (useState only initializes once)
      useEffect(() => {
        if (llmConfig) {
          setLlmForm({
            provider: llmConfig.provider || 'anthropic',
            apiKey: llmConfig.api_key || '',
            model: llmConfig.model || 'claude-sonnet-4-6',
            endpoint: llmConfig.endpoint || '',
          });
        }
      }, [llmConfig]);

      const setLlmField = (k, v) => setLlmForm(f => ({ ...f, [k]: v }));
      const setIntField = (name, key, val) => setIntFields(f => ({ ...f, [name]: { ...f[name], [key]: val } }));

      const saveLlm = async () => {
        setLlmSaving(true);
        try {
          const res = await fetch('/api/llm/config', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider: llmForm.provider, model: llmForm.model, api_key: llmForm.apiKey, endpoint: llmForm.endpoint })
          });
          if (!res.ok) throw new Error('Failed');
          const data = await res.json();
          setLlmConfig(data);
          showToast('LLM configuration saved!', 'success');
        } catch (e) {
          showToast('Failed to save LLM config', 'error');
        } finally {
          setLlmSaving(false);
        }
      };

      const disconnectIntegration = async (name) => {
        if (!confirm(\`Disconnect \${INTEGRATION_META[name]?.label}? This clears all stored credentials.\`)) return;
        await fetch(\`/api/integrations/\${name}\`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: null, api_key: null, api_secret: null })
        });
        setIntegrations(prev => prev.map(i => i.name === name ? { ...i, connected: false, access_token: undefined } : i));
        showToast(\`\${INTEGRATION_META[name]?.label} disconnected\`, 'info');
      };

      const saveIntegration = async (name) => {
        setIntSaving(s => ({ ...s, [name]: true }));
        try {
          const f = intFields[name] || {};
          const ex = {};
          if (f.propertyId) ex.property_id = f.propertyId;
          if (f.siteUrl) ex.site_url = f.siteUrl;
          if (f.authorId) ex.author_id = f.authorId;
          if (f.target) ex.target = f.target;
          if (f.clientId) ex.client_id = f.clientId;
          if (f.redirectUri) ex.redirect_uri = f.redirectUri;
          const pl = {};
          if (f.apiKey) pl.api_key = f.apiKey;
          if (f.apiSecret) pl.api_secret = f.apiSecret;
          if (f.accessToken) pl.access_token = f.accessToken;
          if (Object.keys(ex).length) pl.extra_config = ex;
          const res = await fetch(\`/api/integrations/\${name}\`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pl)
          });
          if (!res.ok) throw new Error('Failed');
          let verified = false;
          try {
            const r = await (await fetch(\`/api/integrations/\${name}/data?endpoint=test\`)).json();
            verified = r.ok === true;
          } catch {}
          const updated = { name, connected: verified, extra_config: ex };
          setIntegrations(prev => {
            const e = prev.find(i => i.name === name);
            return e ? prev.map(i => i.name === name ? { ...i, ...updated } : i) : [...prev, updated];
          });
          showToast(verified ? \`\${INTEGRATION_META[name].label} connected!\` : 'Saved — verify your key', 'success');
        } catch (e) {
          showToast('Save failed', 'error');
        } finally {
          setIntSaving(s => ({ ...s, [name]: false }));
        }
      };

      const providerModels = { anthropic: 'claude-sonnet-4-6', openai: 'gpt-4o', gemini: 'gemini-3.5-flash', custom: 'your-model' };

      return React.createElement('div', { style: { padding: 32, maxWidth: 860, margin: '0 auto' } },
        React.createElement('div', { style: { marginBottom: 28 } },
          React.createElement('h1', { style: { fontSize: 24, fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.02em' } }, 'Settings'),
          React.createElement('p', { style: { color: '#64748b', fontSize: 13, marginTop: 4 } }, 'Configure integrations and AI provider')
        ),

        React.createElement('div', { style: { marginBottom: 32 } },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 } },
            React.createElement(Link2, { size: 16, color: '#6366f1' }),
            React.createElement('h2', { style: { fontSize: 17, fontWeight: 700, color: '#e2e8f0' } }, 'Integrations')
          ),
          React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 14 } },
            INTEGRATIONS.map(name => {
              const meta = INTEGRATION_META[name];
              const integ = integrations.find(i => i.name === name);
              const connected = integ?.connected;
              const fields = INTEGRATION_FIELDS[name] || [];

              return React.createElement('div', {
                key: name,
                style: { background: '#13131a', border: \`1px solid \${connected ? 'rgba(16,185,129,0.2)' : '#1e1e2e'}\`, borderRadius: 14, padding: 22 }
              },
                React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 } },
                  React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
                    React.createElement(BrandIcon, { slug: meta.icon, color: meta.color, size: 20 }),
                    React.createElement('div', null,
                      React.createElement('div', { style: { fontWeight: 700, fontSize: 15, color: '#e2e8f0' } }, meta.label),
                      React.createElement('div', { style: { fontSize: 11, color: '#64748b', textTransform: 'capitalize' } }, meta.category)
                    )
                  ),
                  React.createElement(Badge, { label: connected ? 'Connected' : 'Not Connected', variant: connected ? 'success' : 'muted' })
                ),
                name === 'google' && React.createElement('div', {
                  style: { marginBottom: 14, padding: '10px 14px', borderRadius: 8, background: 'rgba(66,133,244,0.08)', border: '1px solid rgba(66,133,244,0.2)', fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }
                },
                  '🔑 One Google Cloud project, one credential set — GA4, Search Console, and YouTube share it.',
                  React.createElement('br'),
                  'Step 1: paste Client ID + Secret below and click Save. Step 2: click "Connect with Google" to authorize.',
                  React.createElement('br'),
                  React.createElement('span', { style: { color: '#6366f1', userSelect: 'all', fontFamily: 'monospace', fontSize: 11 } },
                    'Redirect URI to register in Google Cloud Console: ', window.location.origin + '/api/auth/google/callback'
                  )
                ),
                React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 } },
                  fields.map(f =>
                    React.createElement('div', { key: f.key },
                      React.createElement(Input, {
                        label: f.label, type: f.type,
                        value: intFields[name]?.[f.key] || '',
                        onChange: v => setIntField(name, f.key, v),
                        placeholder: f.type === 'password' ? '••••••••••••' : \`Enter \${f.label.toLowerCase()}...\`
                      }),
                      f.hint && React.createElement('div', { style: { fontSize: 11, color: '#64748b', marginTop: 4, paddingLeft: 2 } }, f.hint)
                    )
                  )
                ),
                React.createElement('div', { style: { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' } },
                  React.createElement(Btn, {
                    onClick: () => saveIntegration(name),
                    variant: name === 'google' ? 'ghost' : 'primary',
                    size: 'sm',
                    disabled: intSaving[name]
                  },
                    intSaving[name] ? React.createElement(Spinner, { size: 12, color: '#fff' }) : React.createElement(Save, { size: 13 }),
                    intSaving[name] ? 'Saving...' : 'Save'
                  ),
                  name === 'google' && React.createElement(Btn, {
                    onClick: () => { window.location.href = '/api/auth/google'; },
                    variant: 'primary', size: 'sm'
                  },
                    React.createElement(Key, { size: 13 }), 'Connect with Google'
                  ),
                  connected && React.createElement(Btn, {
                    onClick: () => disconnectIntegration(name),
                    variant: 'danger', size: 'sm'
                  },
                    React.createElement(Trash2, { size: 13 }), 'Disconnect'
                  )
                )
              );
            })
          )
        ),

        React.createElement('div', null,
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 } },
            React.createElement(Cpu, { size: 16, color: '#6366f1' }),
            React.createElement('h2', { style: { fontSize: 17, fontWeight: 700, color: '#e2e8f0' } }, 'LLM Configuration')
          ),
          React.createElement('div', { style: { background: '#13131a', border: '1px solid #1e1e2e', borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 } },
            React.createElement(Select, {
              label: 'Provider',
              value: llmForm.provider,
              onChange: v => {
                setLlmField('provider', v);
                setLlmField('model', providerModels[v] || '');
              },
              options: [
                { value: 'anthropic', label: 'Anthropic (Claude)' },
                { value: 'openai', label: 'OpenAI' },
                { value: 'gemini', label: 'Google Gemini' },
                { value: 'custom', label: 'Custom' },
              ]
            }),
            React.createElement(Input, { label: 'API Key', value: llmForm.apiKey, onChange: v => setLlmField('apiKey', v), type: 'password', placeholder: '••••••••••••' }),
            React.createElement(Input, {
              label: 'Model', value: llmForm.model, onChange: v => setLlmField('model', v),
              placeholder: providerModels[llmForm.provider] || 'your-model'
            }),
            llmForm.provider === 'custom' && React.createElement(Input, {
              label: 'Custom Endpoint', value: llmForm.endpoint, onChange: v => setLlmField('endpoint', v),
              placeholder: 'https://your-api.com/v1'
            }),
            React.createElement(Btn, { onClick: saveLlm, variant: 'primary', disabled: llmSaving },
              llmSaving ? React.createElement(Spinner, { size: 14, color: '#fff' }) : React.createElement(Save, { size: 14 }),
              llmSaving ? 'Saving...' : 'Save Configuration'
            )
          )
        )
      );
    }


    function AIChatPanel({ open, onClose, messages, setMessages, currentWorkspace, setCurrentWorkspace }) {
      const [input, setInput] = useState('');
      const [loading, setLoading] = useState(false);
      const messagesEndRef = useRef(null);
      const inputRef = useRef(null);

      useEffect(() => {
        if (open) {
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
          inputRef.current?.focus();
        }
      }, [messages, open]);

      if (!open) return null;

      const quickActions = ['Analyze my SEO', 'Create an agent', 'Draft LinkedIn post', 'Check email'];

      const sendMessage = async (text) => {
        const msg = text || input.trim();
        if (!msg || loading) return;
        setInput('');
        const userMsg = { role: 'user', content: msg, id: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setLoading(true);
        try {
          const res = await fetch('/api/chat', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg, workspace: currentWorkspace })
          });
          if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
          const data = await res.json();
          setMessages(prev => [...prev, { role: 'assistant', content: data.response || data.message || 'Done!', id: Date.now() + 1 }]);
        } catch (e) {
          setMessages(prev => [...prev, { role: 'assistant', content: \`Error: \${e.message}\`, id: Date.now() + 1, error: true }]);
        } finally {
          setLoading(false);
        }
      };

      return React.createElement('div', {
        className: 'chat-panel',
        style: {
          position: 'fixed', bottom: 20, right: 20, width: 380, height: 520, zIndex: 500,
          background: '#13131a', border: '1px solid #1e1e2e', borderRadius: 18,
          display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
        }
      },
        React.createElement('div', { style: { padding: '14px 18px', borderBottom: '1px solid #1e1e2e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 } },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
            React.createElement('div', { style: { width: 8, height: 8, borderRadius: '50%', background: '#10b981' } }),
            React.createElement('span', { style: { fontWeight: 700, fontSize: 14, color: '#e2e8f0' } }, 'AI Assistant')
          ),
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
            React.createElement('div', { style: { display: 'flex', background: '#0a0a0f', borderRadius: 8, padding: 2, border: '1px solid #1e1e2e' } },
              ['marketing', 'sales'].map(w =>
                React.createElement('button', {
                  key: w,
                  onClick: () => setCurrentWorkspace(w),
                  style: {
                    padding: '3px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                    background: currentWorkspace === w ? '#6366f1' : 'none',
                    color: currentWorkspace === w ? '#fff' : '#64748b',
                    transition: 'all 0.15s', textTransform: 'capitalize'
                  }
                }, w)
              )
            ),
            React.createElement('button', {
              onClick: onClose,
              style: { background: '#1e1e2e', border: 'none', borderRadius: 7, padding: 6, cursor: 'pointer', color: '#64748b', display: 'flex' }
            }, React.createElement(X, { size: 14 }))
          )
        ),

        React.createElement('div', { style: { flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 } },
          messages.length === 0 && React.createElement('div', { style: { textAlign: 'center', padding: '30px 20px', color: '#64748b' } },
            React.createElement('div', { style: { fontSize: 32, marginBottom: 12 } }, String.fromCodePoint(0x1F916)),
            React.createElement('div', { style: { fontSize: 14, fontWeight: 600, color: '#94a3b8', marginBottom: 6 } }, 'AI Assistant'),
            React.createElement('div', { style: { fontSize: 12, lineHeight: 1.6 } }, 'Ask me anything about your marketing, sales, or to help create agents.')
          ),
          messages.map(msg =>
            React.createElement('div', {
              key: msg.id,
              style: { display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }
            },
              React.createElement('div', {
                style: {
                  maxWidth: '85%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: msg.role === 'user' ? '#6366f1' : msg.error ? 'rgba(239,68,68,0.1)' : '#1a1a24',
                  border: msg.role !== 'user' ? \`1px solid \${msg.error ? 'rgba(239,68,68,0.3)' : '#1e1e2e'}\` : 'none',
                  color: msg.role === 'user' ? '#fff' : msg.error ? '#ef4444' : '#e2e8f0',
                  fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                }
              }, msg.content)
            )
          ),
          loading && React.createElement('div', { style: { display: 'flex', justifyContent: 'flex-start' } },
            React.createElement('div', {
              style: { padding: '12px 16px', background: '#1a1a24', border: '1px solid #1e1e2e', borderRadius: '14px 14px 14px 4px', display: 'flex', gap: 4, alignItems: 'center' }
            },
              React.createElement('span', { className: 'typing-dot' }),
              React.createElement('span', { className: 'typing-dot' }),
              React.createElement('span', { className: 'typing-dot' })
            )
          ),
          React.createElement('div', { ref: messagesEndRef })
        ),

        React.createElement('div', { style: { padding: '10px 16px 6px', display: 'flex', gap: 6, flexWrap: 'wrap', borderTop: '1px solid #1e1e2e', flexShrink: 0 } },
          quickActions.map(qa =>
            React.createElement('button', {
              key: qa, onClick: () => sendMessage(qa),
              style: {
                fontSize: 11, padding: '4px 10px', borderRadius: 20,
                background: '#0a0a0f', border: '1px solid #1e1e2e',
                color: '#64748b', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                fontWeight: 500
              },
              onMouseEnter: e => { e.target.style.borderColor = '#6366f1'; e.target.style.color = '#6366f1'; },
              onMouseLeave: e => { e.target.style.borderColor = '#1e1e2e'; e.target.style.color = '#64748b'; }
            }, qa)
          )
        ),

        React.createElement('div', { style: { padding: '8px 12px 14px', borderTop: '1px solid #0a0a0f', flexShrink: 0 } },
          React.createElement('div', {
            style: { display: 'flex', gap: 8, background: '#0a0a0f', borderRadius: 12, border: '1px solid #1e1e2e', padding: '8px 8px 8px 14px', alignItems: 'flex-end' }
          },
            React.createElement('textarea', {
              ref: inputRef, value: input,
              onChange: e => setInput(e.target.value),
              onKeyDown: e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
              },
              placeholder: 'Ask the AI assistant...',
              rows: 1,
              style: {
                flex: 1, background: 'none', border: 'none', color: '#e2e8f0',
                fontSize: 13, resize: 'none', outline: 'none', lineHeight: 1.5,
                maxHeight: 100, overflowY: 'auto', fontFamily: 'inherit'
              }
            }),
            React.createElement('button', {
              onClick: () => sendMessage(), disabled: !input.trim() || loading,
              style: {
                width: 32, height: 32, borderRadius: 9, border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                background: input.trim() && !loading ? '#6366f1' : '#1e1e2e',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.15s'
              }
            }, loading ? React.createElement(Spinner, { size: 13, color: '#fff' }) : React.createElement(Send, { size: 14 }))
          )
        )
      );
    }


    function App() {
      const [activePage, setActivePage] = useState('dashboard');
      const [integrations, setIntegrations] = useState([]);
      const [agents, setAgents] = useState([]);
      const [llmConfig, setLlmConfig] = useState(null);
      const [chatOpen, setChatOpen] = useState(false);
      const [chatMessages, setChatMessages] = useState([]);
      const [currentWorkspace, setCurrentWorkspace] = useState('marketing');
      const [loading, setLoading] = useState(true);
      const { toasts, show: showToast } = useToast();

      useEffect(() => {
        const init = async () => {
          try {
            const [intRes, agentRes, llmRes] = await Promise.allSettled([
              fetch('/api/integrations').then(r => r.json()),
              fetch('/api/agents').then(r => r.json()),
              fetch('/api/llm/config').then(r => r.json()),
            ]);
            if (intRes.status === 'fulfilled') setIntegrations(Array.isArray(intRes.value) ? intRes.value : []);
            if (agentRes.status === 'fulfilled') setAgents(Array.isArray(agentRes.value) ? agentRes.value : []);
            if (llmRes.status === 'fulfilled' && llmRes.value) setLlmConfig(llmRes.value);

            // Handle OAuth callback redirects
            const sp = new URLSearchParams(window.location.search);
            if (sp.get('auth') === 'google_ok') {
              showToast('Google connected! GA4, Search Console & YouTube are ready.', 'success');
              window.history.replaceState({}, '', window.location.pathname);
            } else if (sp.get('auth_error')) {
              showToast('Google OAuth failed: ' + sp.get('auth_error'), 'error');
              window.history.replaceState({}, '', window.location.pathname);
            }
          } catch (e) {
            console.error('Init error:', e);
          } finally {
            setLoading(false);
          }
        };
        init();
      }, []);

      // AI Insights event — fired from IntegrationPanel when user clicks "AI Insights"
      useEffect(() => {
        const handler = (e) => {
          const { source, endpoint, data } = e.detail || {};
          const summary = JSON.stringify(data).slice(0, 3000);
          setChatMessages(prev => [...prev, {
            role: 'user',
            content: \`Analyze this \${source} "\${endpoint}" data and give me 3 specific, actionable insights with numbers:\n\n\${summary}\`,
            id: Date.now()
          }]);
          setChatOpen(true);
        };
        window.addEventListener('analyze-data', handler);
        return () => window.removeEventListener('analyze-data', handler);
      }, []);

      // Keyboard shortcuts: G+D = dashboard, G+M = marketing, G+S = sales, G+A = agents, G+P = settings
      useEffect(() => {
        let pending = null;
        const map = { d:'dashboard', m:'marketing', s:'sales', a:'agents', p:'settings' };
        const onKey = (e) => {
          if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
          if (pending === 'g' && map[e.key]) { setActivePage(map[e.key]); pending = null; return; }
          pending = e.key === 'g' ? 'g' : null;
          if (pending) setTimeout(() => { pending = null; }, 800);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
      }, []);

      const renderPage = () => {
        if (loading) return React.createElement('div', {
          style: { display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }
        },
          React.createElement(Spinner, { size: 36 }),
          React.createElement('div', { style: { color: '#64748b', fontSize: 14 } }, 'Loading AIHive...')
        );

        switch (activePage) {
          case 'dashboard':  return React.createElement(Dashboard, { integrations, agents, setActivePage });
          case 'marketing':  return React.createElement(MarketingWorkspace, { integrations, setActivePage });
          case 'sales':      return React.createElement(SalesWorkspace, { integrations, setActivePage });
          case 'agents':     return React.createElement(AgentStudio, { agents, setAgents, setChatOpen, setChatMessages, showToast });
          case 'settings':   return React.createElement(SettingsPage, { integrations, setIntegrations, llmConfig, setLlmConfig, showToast });
          default:           return React.createElement(Dashboard, { integrations, agents, setActivePage });
        }
      };

      return React.createElement('div', { style: { display: 'flex', height: '100vh', overflow: 'hidden' } },
        React.createElement(Sidebar, {
          activePage, setActivePage, integrations, agents, chatOpen, setChatOpen
        }),
        React.createElement('main', {
          style: { flex: 1, marginLeft: 240, height: '100vh', overflowY: 'auto', background: '#0a0a0f' }
        }, renderPage()),
        React.createElement(AIChatPanel, {
          open: chatOpen, onClose: () => setChatOpen(false),
          messages: chatMessages, setMessages: setChatMessages,
          currentWorkspace, setCurrentWorkspace
        }),
        React.createElement(ToastContainer, { toasts })
      );
    }

    const root = createRoot(document.getElementById('root'));
    root.render(React.createElement(App));
  `;
}