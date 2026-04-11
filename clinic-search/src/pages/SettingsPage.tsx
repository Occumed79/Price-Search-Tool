import { useState } from "react";
import { Settings, Plus, Trash2, Shield, BookOpen, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import {
  useListDomainRules,
  useCreateDomainRule,
  useDeleteDomainRule,
  useListSearchPresets,
  useCreateSearchPreset,
  useDeleteSearchPreset,
  getListDomainRulesQueryKey,
  getListSearchPresetsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: domainRules = [], isLoading: loadingRules } = useListDomainRules();
  const { data: presets = [], isLoading: loadingPresets } = useListSearchPresets();

  const createRule = useCreateDomainRule();
  const deleteRule = useDeleteDomainRule();
  const createPreset = useCreateSearchPreset();
  const deletePreset = useDeleteSearchPreset();

  const [newDomain, setNewDomain] = useState("");
  const [newRuleType, setNewRuleType] = useState<"prefer" | "block">("block");
  const [newRuleReason, setNewRuleReason] = useState("");

  const [presetName, setPresetName] = useState("");
  const [presetClinicType, setPresetClinicType] = useState("urgent care");
  const [presetService, setPresetService] = useState("urgent care visit");

  async function handleAddRule(e: React.FormEvent) {
    e.preventDefault();
    if (!newDomain) return;
    await createRule.mutateAsync({ data: { domain: newDomain, ruleType: newRuleType, reason: newRuleReason || undefined } });
    setNewDomain("");
    setNewRuleReason("");
    queryClient.invalidateQueries({ queryKey: getListDomainRulesQueryKey() });
  }

  async function handleDeleteRule(id: number) {
    await deleteRule.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getListDomainRulesQueryKey() });
  }

  async function handleAddPreset(e: React.FormEvent) {
    e.preventDefault();
    if (!presetName) return;
    await createPreset.mutateAsync({ data: { name: presetName, clinicType: presetClinicType, serviceType: presetService } });
    setPresetName("");
    queryClient.invalidateQueries({ queryKey: getListSearchPresetsQueryKey() });
  }

  async function handleDeletePreset(id: number) {
    await deletePreset.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getListSearchPresetsQueryKey() });
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
          <Settings className="w-4 h-4 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-white/90">Settings</h1>
          <p className="text-xs text-white/40">Domain rules, presets, and configuration</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Domain Rules */}
        <section className="glass-card rounded-xl p-5 border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-cyan-400/70" />
            <h2 className="text-sm font-semibold text-white/80">Domain Rules</h2>
          </div>

          <form onSubmit={handleAddRule} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="example.com"
              className="flex-1 glass-input rounded-lg px-3 py-2 text-xs text-white/80 placeholder-white/25 focus:outline-none"
              required
            />
            <select
              value={newRuleType}
              onChange={(e) => setNewRuleType(e.target.value as "prefer" | "block")}
              className="glass-input rounded-lg px-3 py-2 text-xs text-white/80 appearance-none focus:outline-none"
            >
              <option value="prefer" className="bg-slate-900">Prefer</option>
              <option value="block" className="bg-slate-900">Block</option>
            </select>
            <input
              type="text"
              value={newRuleReason}
              onChange={(e) => setNewRuleReason(e.target.value)}
              placeholder="Reason (optional)"
              className="flex-1 glass-input rounded-lg px-3 py-2 text-xs text-white/80 placeholder-white/25 focus:outline-none"
            />
            <button
              type="submit"
              disabled={createRule.isPending}
              className="flex items-center gap-1.5 px-3 py-2 bg-cyan-500/15 border border-cyan-500/25 text-cyan-300 rounded-lg text-xs font-medium hover:bg-cyan-500/25 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </form>

          {loadingRules && <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 text-cyan-400 animate-spin" /></div>}

          {domainRules.length === 0 && !loadingRules && (
            <p className="text-xs text-white/30 text-center py-4">No domain rules configured.</p>
          )}

          <div className="space-y-2">
            {domainRules.map((rule) => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                    rule.ruleType === "prefer" ? "badge-direct" : "badge-weak"
                  }`}>
                    {rule.ruleType}
                  </span>
                  <span className="text-xs text-white/70 font-mono">{rule.domain}</span>
                  {rule.reason && <span className="text-[10px] text-white/30">{rule.reason}</span>}
                </div>
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="p-1 rounded hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Search Presets */}
        <section className="glass-card rounded-xl p-5 border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-cyan-400/70" />
            <h2 className="text-sm font-semibold text-white/80">Search Presets</h2>
          </div>

          <form onSubmit={handleAddPreset} className="flex gap-2 mb-4">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Preset name"
              className="flex-1 glass-input rounded-lg px-3 py-2 text-xs text-white/80 placeholder-white/25 focus:outline-none"
              required
            />
            <input
              type="text"
              value={presetClinicType}
              onChange={(e) => setPresetClinicType(e.target.value)}
              placeholder="Clinic type"
              className="flex-1 glass-input rounded-lg px-3 py-2 text-xs text-white/80 placeholder-white/25 focus:outline-none"
            />
            <input
              type="text"
              value={presetService}
              onChange={(e) => setPresetService(e.target.value)}
              placeholder="Service type"
              className="flex-1 glass-input rounded-lg px-3 py-2 text-xs text-white/80 placeholder-white/25 focus:outline-none"
            />
            <button
              type="submit"
              disabled={createPreset.isPending}
              className="flex items-center gap-1.5 px-3 py-2 bg-cyan-500/15 border border-cyan-500/25 text-cyan-300 rounded-lg text-xs font-medium hover:bg-cyan-500/25 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Save
            </button>
          </form>

          {loadingPresets && <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 text-cyan-400 animate-spin" /></div>}

          {presets.length === 0 && !loadingPresets && (
            <p className="text-xs text-white/30 text-center py-4">No saved presets yet.</p>
          )}

          <div className="space-y-2">
            {presets.map((preset) => (
              <motion.div
                key={preset.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]"
              >
                <div>
                  <div className="text-xs font-medium text-white/70">{preset.name}</div>
                  <div className="text-[10px] text-white/30">
                    {preset.clinicType} · {preset.serviceType}
                    {preset.location && ` · ${preset.location}`}
                  </div>
                </div>
                <button
                  onClick={() => handleDeletePreset(preset.id)}
                  className="p-1 rounded hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* API Key status */}
        <section className="glass-card rounded-xl p-5 border border-white/[0.06]">
          <h2 className="text-sm font-semibold text-white/80 mb-4">Search Providers</h2>
          <div className="space-y-2 text-xs text-white/40">
            <p>Configure environment variables to enable live search:</p>
            <p className="text-[11px] text-amber-300/70">
              API keys are set on your backend host (Render) environment page — they are not entered directly in this UI.
            </p>
            <div className="font-mono text-[11px] space-y-1 bg-white/[0.03] rounded-lg p-3 border border-white/[0.05]">
              <div><span className="text-cyan-400/70">SERPER_API_KEY</span> — Google search via Serper.dev</div>
              <div><span className="text-cyan-400/70">TAVILY_API_KEY</span> — AI-powered web search via Tavily</div>
              <div><span className="text-cyan-400/70">FIRECRAWL_API_KEY</span> — Advanced web crawling</div>
              <div><span className="text-cyan-400/70">EXA_API_KEY</span> — Exa semantic/keyword web search</div>
              <div><span className="text-cyan-400/70">BROWSE_AI_API_KEY</span> — Browse AI provider (optional)</div>
              <div><span className="text-cyan-400/70">BROWSER_USE_API_KEY</span> — Browser-use provider (optional)</div>
              <div><span className="text-cyan-400/70">OLOSTEP_API_KEY</span> — Olostep provider (optional)</div>
              <div><span className="text-cyan-400/70">CLOD_API_KEY</span> — Clod provider (optional)</div>
              <div><span className="text-cyan-400/70">BROWSE_AI_SEARCH_URL</span>/<span className="text-cyan-400/70">BROWSER_USE_SEARCH_URL</span> — endpoint URL required</div>
              <div><span className="text-cyan-400/70">OLOSTEP_SEARCH_URL</span>/<span className="text-cyan-400/70">CLOD_SEARCH_URL</span> — endpoint URL required</div>
              <div><span className="text-cyan-400/70">GROQ_API_KEY</span> — AI price confirmation</div>
              <div><span className="text-cyan-400/70">OPENROUTER_KEY</span>/<span className="text-cyan-400/70">OPENROUTER_API_KEY</span> — AI fallback provider</div>
            </div>
            <p className="text-[10px] text-white/25">Without API keys, demo results are shown to illustrate the tool's features.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
