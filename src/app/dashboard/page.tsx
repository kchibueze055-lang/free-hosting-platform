import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ExternalLink, Trash2, Globe, Plus } from 'lucide-react';

export const revalidate = 0; // Disable static caching so new uploads show instantly

interface Site {
  id: string;
  site_name: string;
  file_path: string;
  created_at: string;
}

export default async function DashboardPage() {
  // Fetch uploaded sites from Supabase
  const { data: sites, error } = await supabase
    .from('sites')
    .select('id, site_name, file_path, created_at')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Hosted Sites</h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage and monitor all active web deployments.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            <Plus className="w-4 h-4" /> Deploy New Site
          </Link>
        </div>

        {/* Database Error Alert */}
        {error && (
          <div className="bg-red-950/50 border border-red-500 text-red-300 p-4 rounded-lg">
            Failed to load sites: {error.message}
          </div>
        )}

        {/* Empty State */}
        {!error && (!sites || sites.length === 0) && (
          <div className="text-center py-16 border border-dashed border-slate-800 rounded-xl bg-slate-900/50">
            <Globe className="w-12 h-12 mx-auto text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-slate-300">No sites deployed yet</h3>
            <p className="text-slate-500 text-sm mt-1">
              Upload your first project to make it live instantly.
            </p>
          </div>
        )}

        {/* Sites Grid */}
        {sites && sites.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sites.map((site: Site) => {
              const liveUrl = `/sites/${site.site_name}`;
              return (
                <div
                  key={site.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h2 className="font-semibold text-lg text-white truncate max-w-[200px]">
                        {site.site_name}
                      </h2>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Live
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Created: {new Date(site.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <Link
                      href={liveUrl}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300 transition"
                    >
                      Visit Site <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      title="Delete site"
                      className="text-slate-500 hover:text-red-400 transition p-1 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}