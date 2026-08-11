// Optional accounts layer — the app is fully usable signed-out (local-only guest mode).
// Every method is a safe no-op (returns an error string) when supabaseClient isn't configured.
"use strict";

const Auth = {
  _listeners: [],

  isAvailable() {
    return !!supabaseClient;
  },

  onChange(fn) {
    this._listeners.push(fn);
  },

  _notify(user) {
    this._listeners.forEach((fn) => fn(user));
  },

  async currentUser() {
    if (!supabaseClient) return null;
    const { data } = await supabaseClient.auth.getUser();
    return (data && data.user) || null;
  },

  async signUp(email, password) {
    if (!supabaseClient) return { error: "Sign-in isn't available on this install." };
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) return { error: error.message };
    this._notify(data.user);
    return { user: data.user };
  },

  async signIn(email, password) {
    if (!supabaseClient) return { error: "Sign-in isn't available on this install." };
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    this._notify(data.user);
    return { user: data.user };
  },

  async signOut() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    this._notify(null);
  },
};

if (supabaseClient) {
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    Auth._notify((session && session.user) || null);
  });
}
