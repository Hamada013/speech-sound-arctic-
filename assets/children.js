/* The one list of children for every articulation app. It holds who each child is and who is playing now;
   each app keeps its own progress under the same child id. */
((root) => {
  const KEY = 'articulation-children-v1', AVATAR_KEY = 'articulation-account-avatars-v1';
  /* Each app's own store. Children made there before the shared list existed are brought in from these. */
  const APPS = ['articulation-words', 'articulation-syllables', 'articulation-phrases', 'articulation-sentences', 'articulation-stories', 'articulation-approaches'];
  const appKey = app => `${app}-children-v1`;
  const sameName = name => String(name || '').normalize('NFKC').replace(/[ً-ٰٟـ]/g, '').trim().toLocaleLowerCase();
  const newId = () => root.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const read = (storage, key) => { try { return JSON.parse(storage.getItem(key)); } catch { return null; } };
  const person = child => ({ id: child.id, name: child.name, created: child.created || new Date().toISOString(), ...(child.character ? { character: child.character } : {}) });

  /* Brings in every child an app knows about. A child with the same name as one already listed becomes that
     child: the app's record takes the shared id, so its progress follows. Runs on every load, so a child made
     by an older cached copy of an app still joins the list. */
  function merge(storage, store, fresh = false) {
    let changed = false;
    for (const app of APPS) {
      const data = read(storage, appKey(app));
      if (data?.schema !== 1 || !Array.isArray(data.children)) continue;
      let local = false;
      for (const child of data.children) {
        if (!child?.id || store.deletedChildren?.[child.id]) continue;
        let match = store.children.find(entry => entry.id === child.id) || store.children.find(entry => sameName(entry.name) === sameName(child.name));
        if (!match) { match = person(child); store.children.push(match); changed = true; }
        else if (!match.character && child.character) { match.character = child.character; changed = true; }
        if (match.id !== child.id && !data.children.some(entry => entry.id === match.id)) {
          if (data.active === child.id) data.active = match.id;
          child.id = match.id; local = true;
        }
      }
      /* The first time only, the child last active in an app stays active. */
      if (fresh && store.active === null && data.active && store.children.some(entry => entry.id === data.active)) { store.active = data.active; changed = true; }
      if (local) try { storage.setItem(appKey(app), JSON.stringify(data)); } catch {}
    }
    /* Children tested in the articulation test (its own records, read only): each joins once, by its shared id or name. */
    const tested = read(storage, 'articulation-cases-v2');
    if (tested?.version === 2 && Array.isArray(tested.children)) for (const child of tested.children) {
      const id = child.sharedId || child.id;
      if (!child?.name || store.deletedChildren?.[id]) continue;
      if (!store.children.some(entry => entry.id === id || sameName(entry.name) === sameName(child.name))) { store.children.push(person({ id, name: child.name, created: child.createdAt })); changed = true; }
    }
    return changed;
  }

  function load(storage) {
    let store = read(storage, KEY);
    const fresh = !(store?.schema === 1 && Array.isArray(store.children));
    if (fresh) store = { schema: 1, active: null, children: [], deletedChildren: {} };
    store.deletedChildren ||= {};
    if (merge(storage, store, fresh) || fresh) try { storage.setItem(KEY, JSON.stringify(store)); } catch {}
    /* The accounts window (the shared assets/accounts.js) removes a deleted child from this list only; their
       progress in every part and their plan go on the next load. */
    for (const id of Object.keys(store.deletedChildren)) if (left(storage, id)) forget(storage, id);
    return store;
  }
  const left = (storage, id) => APPS.some(app => read(storage, appKey(app))?.children?.some?.(child => child.id === id)) || !!read(storage, 'articulation-plans-v1')?.plans?.[id];

  /* Deleting a child removes them from the list and their progress from every app on this device. */
  function forget(storage, id) {
    for (const app of APPS) {
      const data = read(storage, appKey(app));
      if (data?.schema !== 1 || !Array.isArray(data.children)) continue;
      data.children = data.children.filter(child => child.id !== id);
      if (data.active === id) data.active = null;
      try { storage.setItem(appKey(app), JSON.stringify(data)); } catch {}
    }
    /* The child's intervention plan (assets/therapy.js) goes too. */
    const plans = read(storage, 'articulation-plans-v1');
    if (plans?.plans?.[id]) { delete plans.plans[id]; try { storage.setItem('articulation-plans-v1', JSON.stringify(plans)); } catch {} }
  }

  const api = { KEY, AVATAR_KEY, APPS, appKey, sameName, load, merge, forget };
  if (typeof module !== 'undefined') module.exports = api;
  if (!root.document) return;

  let storage = null;
  try { storage = root.localStorage; } catch {}
  let store = storage ? load(storage) : { schema: 1, active: null, children: [], deletedChildren: {} };
  function save() {
    try { storage.setItem(KEY, JSON.stringify(store)); return true; } catch { return false; }
  }
  root.ArticulationChildren = {
    ...api,
    list: () => store.children,
    active: () => store.children.find(child => child.id === store.active) || null,
    choose(id) { store.active = id; return save(); },
    /* Returns the child with this name, adding them if there is none. */
    add(name, character) {
      let child = store.children.find(entry => sameName(entry.name) === sameName(name));
      if (!child) {
        // The game character is chosen in the games when it is not given here (assets/clinic.js).
        child = { id: newId(), name, created: new Date().toISOString(), ...(character ? { character: character === 'girl' ? 'girl' : 'boy' } : {}) };
        store.children.push(child);
        save();
      }
      return child;
    },
    reload() { if (storage) store = load(storage); return store; },
    /* Saves more about a child (the intervention plan, the summary for the clinic) without touching who they are. */
    update(id, patch) {
      const fresh = storage ? load(storage) : store, child = fresh.children.find(entry => entry.id === id);
      if (!child) return false;
      Object.assign(child, patch); store = fresh;
      return save();
    },
  };
})(globalThis);
