package com.dnest.app;

import android.content.Context;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

final class WidgetApi {
    record Person(String name, String localTime, Double latitude, Double longitude) {}
    record State(boolean sharing, Integer distanceKm, Person me, Person partner) {}

    private WidgetApi() {}

    static State fetch(Context context) throws Exception {
        HttpURLConnection connection = open(context, "GET");
        int status = connection.getResponseCode();
        String body = read(status >= 400 ? connection.getErrorStream() : connection.getInputStream());
        if (status != 200) throw new IllegalStateException("DNest returned " + status);
        JSONObject root = new JSONObject(body);
        JSONObject me = root.getJSONObject("me");
        JSONObject partner = root.optJSONObject("partner");
        return new State(
                root.optBoolean("sharing", false),
                root.isNull("distanceKm") ? null : root.getInt("distanceKm"),
                person(me),
                partner == null ? null : person(partner)
        );
    }

    static void uploadLocation(Context context, double latitude, double longitude) throws Exception {
        HttpURLConnection connection = open(context, "POST");
        connection.setRequestProperty("Content-Type", "application/json");
        connection.setDoOutput(true);
        JSONObject body = new JSONObject()
                .put("latitude", latitude)
                .put("longitude", longitude);
        try (OutputStream output = connection.getOutputStream()) {
            output.write(body.toString().getBytes(StandardCharsets.UTF_8));
        }
        if (connection.getResponseCode() != 200) {
            throw new IllegalStateException("Location upload failed");
        }
        connection.disconnect();
    }

    private static Person person(JSONObject value) {
        JSONObject location = value.optJSONObject("location");
        Double latitude = location == null || location.isNull("latitude")
                ? null : location.optDouble("latitude");
        Double longitude = location == null || location.isNull("longitude")
                ? null : location.optDouble("longitude");
        return new Person(
                value.optString("name", "Partner"),
                value.optString("localTime", ""),
                latitude,
                longitude
        );
    }

    private static HttpURLConnection open(Context context, String method) throws Exception {
        if (!WidgetPreferences.configured(context)) throw new IllegalStateException("Not connected");
        URL url = new URL(WidgetPreferences.server(context) + "/api/native-widget/state");
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod(method);
        connection.setConnectTimeout(12_000);
        connection.setReadTimeout(12_000);
        connection.setRequestProperty("Authorization", "Bearer " + WidgetPreferences.token(context));
        connection.setRequestProperty("Accept", "application/json");
        connection.setUseCaches(false);
        return connection;
    }

    private static String read(InputStream stream) throws Exception {
        if (stream == null) return "";
        StringBuilder value = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) value.append(line);
        }
        return value.toString();
    }
}
