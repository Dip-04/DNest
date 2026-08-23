package com.dnest.app;

import android.content.Context;
import android.content.SharedPreferences;

final class WidgetPreferences {
    private static final String NAME = "dnest_widget";
    private static final String SERVER = "server";
    private static final String TOKEN = "token";

    private WidgetPreferences() {}

    static void save(Context context, String server, String token) {
        String normalized = server == null ? "" : server.trim();
        while (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        context.getSharedPreferences(NAME, Context.MODE_PRIVATE)
                .edit()
                .putString(SERVER, normalized)
                .putString(TOKEN, token == null ? "" : token.trim())
                .apply();
    }

    static String server(Context context) {
        return preferences(context).getString(SERVER, "");
    }

    static String token(Context context) {
        return preferences(context).getString(TOKEN, "");
    }

    static boolean configured(Context context) {
        return server(context).startsWith("https://") && token(context).length() >= 40;
    }

    private static SharedPreferences preferences(Context context) {
        return context.getSharedPreferences(NAME, Context.MODE_PRIVATE);
    }
}

