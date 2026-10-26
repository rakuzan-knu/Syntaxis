import { Maximize2, Minus, X } from 'lucide-react';
import { useI18n } from '@/shared/i18n';
import { useWindowControls } from './desktopContext';

const COLORS = ['bg-[#ff5f57]', 'bg-[#febc2e]', 'bg-[#28c840]'] as const;
const HOVER = [
  'group-hover/lights:bg-[#ff5f57]',
  'group-hover/lights:bg-[#febc2e]',
  'group-hover/lights:bg-[#28c840]',
] as const;

export function TrafficLights({
  muted = false,
  size = 'md',
}: {
  muted?: boolean;
  size?: 'sm' | 'md';
}) {
  const { t } = useI18n();
  const controls = useWindowControls();
  const dot = size === 'sm' ? 'size-2' : 'size-2.5';
  const tone = (index: number) => (muted ? 'bg-win-line' : COLORS[index]);

  if (!controls) {
    return (
      <span aria-hidden="true" className="flex shrink-0 gap-1.5">
        {COLORS.map((color, index) => (
          <span key={color} className={`${dot} rounded-full ${tone(index)}`} />
        ))}
      </span>
    );
  }

  const labels = t.ui.windows;
  const actions = [
    { label: labels.close, run: controls.close, Icon: X },
    { label: labels.minimize, run: controls.minimize, Icon: Minus },
    { label: controls.solo ? labels.restoreAll : labels.zoom, run: controls.zoom, Icon: Maximize2 },
  ] as const;

  return (
    <span className="group/lights flex shrink-0 gap-1.5">
      {actions.map(({ label, run, Icon }, index) => (
        <button
          key={label}
          type="button"
          aria-label={label}
          title={label}
          onClick={(event) => {
            event.stopPropagation();
            run();
          }}
          className={`relative grid ${dot} cursor-pointer place-items-center rounded-full transition-colors before:absolute before:-inset-1.5 before:content-[''] ${HOVER[index]} ${tone(index)}`}
        >
          <Icon
            aria-hidden="true"
            strokeWidth={3}
            className="size-[0.4375rem] text-black/55 opacity-0 transition-opacity group-hover/lights:opacity-100"
          />
        </button>
      ))}
    </span>
  );
}
