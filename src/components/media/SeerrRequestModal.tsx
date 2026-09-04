import * as React from 'react';
import { X, Send, Film, Tv, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { useSeerrStore } from '../../state/stores/useSeerrStore';
import { seerrService, type SeerrMediaItem } from '../../api/services/seerrService';
import { useUIStore } from '../../state/stores/useUIStore';

export interface SeerrRequestModalProps {
  item: SeerrMediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (itemId: number) => void;
}

export function SeerrRequestModal({
  item,
  isOpen,
  onClose,
  onSuccess,
}: SeerrRequestModalProps) {
  const serverUrl = useSeerrStore((s) => s.serverUrl);
  const apiKey = useSeerrStore((s) => s.apiKey);
  const addToast = useUIStore((s) => s.addToast);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [requestAllSeasons, setRequestAllSeasons] = React.useState(true);
  const [selectedSeasons, setSelectedSeasons] = React.useState<number[]>([1]);

  React.useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
      setErrorMsg(null);
      setIsSuccess(false);
      setRequestAllSeasons(true);
      setSelectedSeasons([1]);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const totalSeasons = Math.max(1, item.seasonsCount || 1);
  const availableSeasonList = Array.from({ length: totalSeasons }, (_, i) => i + 1);

  const toggleSeason = (seasonNum: number) => {
    if (selectedSeasons.includes(seasonNum)) {
      if (selectedSeasons.length > 1) {
        setSelectedSeasons(selectedSeasons.filter((s) => s !== seasonNum));
      }
    } else {
      setSelectedSeasons([...selectedSeasons, seasonNum].sort((a, b) => a - b));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await seerrService.requestMedia(serverUrl, apiKey, {
        mediaType: item.mediaType,
        mediaId: item.id,
        seasons: item.mediaType === 'tv' ? (requestAllSeasons ? 'all' : selectedSeasons) : undefined,
      });

      setIsSuccess(true);
      addToast({
        title: 'Request Submitted',
        description: `"${item.title}" was requested successfully.`,
        type: 'success',
      });
      onSuccess?.(item.id);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit request to Seerr.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-label={`Request ${item.title}`}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-lg bg-surface-950 border border-surface-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-800">
          <div className="flex items-center gap-2">
            {item.mediaType === 'movie' ? (
              <Film className="h-5 w-5 text-brand-400" />
            ) : (
              <Tv className="h-5 w-5 text-purple-400" />
            )}
            <h2 className="text-base font-semibold text-surface-50 truncate max-w-xs sm:max-w-sm">
              Request Media
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close request modal"
            className="p-1 rounded-lg text-surface-400 hover:text-surface-100 hover:bg-surface-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="flex gap-4">
            {item.posterPath ? (
              <img
                src={item.posterPath}
                alt={item.title}
                className="w-24 h-36 object-cover rounded-xl border border-surface-800 shrink-0 shadow-md"
              />
            ) : (
              <div className="w-24 h-36 rounded-xl bg-surface-900 border border-surface-800 flex items-center justify-center shrink-0">
                {item.mediaType === 'movie' ? (
                  <Film className="h-8 w-8 text-surface-600" />
                ) : (
                  <Tv className="h-8 w-8 text-surface-600" />
                )}
              </div>
            )}

            <div className="flex-1 min-w-0 space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-400">
                {item.mediaType === 'movie' ? 'Movie' : 'TV Series'}
              </span>
              <h3 className="text-lg font-bold text-surface-50 leading-snug">{item.title}</h3>
              {item.releaseDate && (
                <p className="text-xs text-surface-400">{item.releaseDate.slice(0, 4)}</p>
              )}
              {item.overview && (
                <p className="text-xs text-surface-300 line-clamp-3 leading-relaxed">
                  {item.overview}
                </p>
              )}
            </div>
          </div>

          {/* TV Season Selector */}
          {item.mediaType === 'tv' && !isSuccess && (
            <div className="p-3.5 rounded-xl bg-surface-900/70 border border-surface-800 space-y-3">
              <span className="text-xs font-semibold text-surface-200 block">Season Selection</span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setRequestAllSeasons(true)}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                    requestAllSeasons
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'bg-surface-800 text-surface-300 hover:text-surface-100'
                  }`}
                >
                  All Seasons
                </button>
                <button
                  type="button"
                  onClick={() => setRequestAllSeasons(false)}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                    !requestAllSeasons
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'bg-surface-800 text-surface-300 hover:text-surface-100'
                  }`}
                >
                  Specific Seasons
                </button>
              </div>

              {!requestAllSeasons && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {availableSeasonList.map((num) => {
                    const isSelected = selectedSeasons.includes(num);
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => toggleSeason(num)}
                        className={`px-2.5 py-1 text-xs rounded-md font-mono transition-colors ${
                          isSelected
                            ? 'bg-brand-500/20 text-brand-300 border border-brand-500/50'
                            : 'bg-surface-850 text-surface-400 border border-surface-750 hover:text-surface-200'
                        }`}
                      >
                        Season {num}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Message */}
          {isSuccess && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                Request submitted successfully! It is now queued in Jellyseerr for automated retrieval.
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-surface-800 bg-surface-900/50">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {isSuccess ? 'Done' : 'Cancel'}
          </Button>

          {!isSuccess && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Submit Request</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
