import { useCallback } from 'react';
import { useAppContext } from '../../app/AppContext';
import type { ItemSheetState } from '../../hooks/useSheet';
import { ItemSheet } from './presenter';

type Props = { state: ItemSheetState };

export function ItemSheetContainer({ state: sh }: Props) {
  const { itinerary, sheet } = useAppContext();
  const { days, items, createItem, updateItem } = itinerary;
  const { patchItemSheet, close } = sheet;

  const canSave = !!sh.title.trim();

  const onSave = useCallback(async () => {
    if (!canSave) return;
    const body = { startTime: sh.startTime, title: sh.title.trim(), description: sh.description, url: sh.url.trim() };
    if (sh.mode === 'add') {
      await createItem({ dayId: sh.dayId, ...body });
    } else if (sh.id) {
      // 日が変わったときだけ dayId を送る。送ると「移動先の末尾」に置かれる(B6)。
      // 同じ日のまま dayId を送ると末尾へ動いてしまうので送らない。
      const prev = items.find((x) => x.id === sh.id);
      const moved = prev && prev.dayId !== sh.dayId;
      await updateItem(sh.id, moved ? { ...body, dayId: sh.dayId } : body);
    }
    close();
  }, [canSave, sh, items, createItem, updateItem, close]);

  return (
    <ItemSheet
      title={sh.mode === 'add' ? '予定を追加' : '予定を編集'}
      saveLabel={sh.mode === 'edit' ? '保存する' : '追加する'}
      canSave={canSave}
      days={days.map((d, i) => ({ n: i + 1, active: d.id === sh.dayId, onPick: () => patchItemSheet({ dayId: d.id }) }))}
      startTime={sh.startTime}
      itemTitle={sh.title}
      description={sh.description}
      url={sh.url}
      onStartTime={(e) => patchItemSheet({ startTime: e.target.value })}
      onTitle={(e) => patchItemSheet({ title: e.target.value })}
      onDescription={(e) => patchItemSheet({ description: e.target.value })}
      onUrl={(e) => patchItemSheet({ url: e.target.value })}
      onSave={() => void onSave()}
      onClose={close}
    />
  );
}
