package com.dnest.app;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;

import java.io.File;
import java.io.FileOutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

final class MapWidgetRenderer {
    private static final int WIDTH = 480;
    private static final int HEIGHT = 300;
    private static final int TILE_SIZE = 256;
    private static final long MAX_TILE_AGE_MS = 7L * 24 * 60 * 60 * 1000;

    private MapWidgetRenderer() {}

    static Bitmap render(Context context, WidgetApi.State state) {
        WidgetApi.Person me = state.me();
        WidgetApi.Person partner = state.partner();
        if (!state.sharing() || partner == null
                || me.latitude() == null || me.longitude() == null
                || partner.latitude() == null || partner.longitude() == null) {
            return null;
        }

        int zoom = zoomFor(state.distanceKm());
        double centerLatitude = (me.latitude() + partner.latitude()) / 2;
        double centerLongitude = (me.longitude() + partner.longitude()) / 2;
        double centerX = worldX(centerLongitude, zoom);
        double centerY = worldY(centerLatitude, zoom);
        double left = centerX - WIDTH / 2.0;
        double top = centerY - HEIGHT / 2.0;

        Bitmap result = Bitmap.createBitmap(WIDTH, HEIGHT, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(result);
        canvas.drawColor(Color.rgb(232, 241, 239));
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);

        int firstX = (int) Math.floor(left / TILE_SIZE);
        int lastX = (int) Math.floor((left + WIDTH) / TILE_SIZE);
        int firstY = (int) Math.floor(top / TILE_SIZE);
        int lastY = (int) Math.floor((top + HEIGHT) / TILE_SIZE);
        int tileCount = 1 << zoom;
        boolean drewTile = false;

        for (int tileY = firstY; tileY <= lastY; tileY++) {
            if (tileY < 0 || tileY >= tileCount) continue;
            for (int tileX = firstX; tileX <= lastX; tileX++) {
                int wrappedX = ((tileX % tileCount) + tileCount) % tileCount;
                Bitmap tile = loadTile(context, zoom, wrappedX, tileY);
                if (tile == null) continue;
                canvas.drawBitmap(
                        tile,
                        (float) (tileX * TILE_SIZE - left),
                        (float) (tileY * TILE_SIZE - top),
                        paint
                );
                drewTile = true;
            }
        }
        if (!drewTile) return null;

        float meX = (float) (worldX(me.longitude(), zoom) - left);
        float meY = (float) (worldY(me.latitude(), zoom) - top);
        float partnerX = (float) (worldX(partner.longitude(), zoom) - left);
        float partnerY = (float) (worldY(partner.latitude(), zoom) - top);

        paint.setColor(Color.rgb(67, 164, 219));
        paint.setStrokeWidth(8);
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeCap(Paint.Cap.ROUND);
        Path route = new Path();
        route.moveTo(meX, meY);
        float curve = Math.max(28, Math.abs(partnerX - meX) * 0.18f);
        route.cubicTo(
                meX + (partnerX - meX) * 0.32f,
                meY - curve,
                meX + (partnerX - meX) * 0.68f,
                partnerY + curve,
                partnerX,
                partnerY
        );
        canvas.drawPath(route, paint);

        drawHeartPin(canvas, paint, meX, meY);
        drawHeartPin(canvas, paint, partnerX, partnerY);
        drawAvatar(
                canvas,
                paint,
                meX - 34,
                meY - 48,
                me.name(),
                Color.rgb(249, 201, 213),
                true
        );
        drawAvatar(
                canvas,
                paint,
                partnerX + 34,
                partnerY + 48,
                partner.name(),
                Color.rgb(199, 216, 242),
                false
        );

        String distance = state.distanceKm() == null
                ? "Waiting for locations"
                : state.distanceKm() + " km apart";
        paint.setStyle(Paint.Style.FILL);
        paint.setColor(Color.argb(220, 255, 255, 255));
        canvas.drawRoundRect(WIDTH / 2f - 88, HEIGHT - 52, WIDTH / 2f + 88, HEIGHT - 12, 20, 20, paint);
        paint.setColor(Color.rgb(54, 43, 50));
        paint.setTextAlign(Paint.Align.CENTER);
        paint.setTextSize(21);
        paint.setFakeBoldText(true);
        canvas.drawText(distance, WIDTH / 2f, HEIGHT - 25, paint);
        paint.setFakeBoldText(false);

        paint.setStyle(Paint.Style.FILL);
        paint.setColor(Color.argb(190, 255, 255, 255));
        canvas.drawRoundRect(6, HEIGHT - 24, 126, HEIGHT - 5, 8, 8, paint);
        paint.setColor(Color.rgb(70, 70, 70));
        paint.setTextSize(12);
        paint.setTextAlign(Paint.Align.LEFT);
        canvas.drawText("© OpenStreetMap", 10, HEIGHT - 10, paint);
        return result;
    }

    private static void drawHeartPin(
            Canvas canvas,
            Paint paint,
            float x,
            float y
    ) {
        float safeX = Math.max(18, Math.min(WIDTH - 18, x));
        float safeY = Math.max(18, Math.min(HEIGHT - 18, y));
        Path heart = new Path();
        heart.moveTo(safeX, safeY + 14);
        heart.cubicTo(safeX - 25, safeY, safeX - 13, safeY - 19, safeX, safeY - 7);
        heart.cubicTo(safeX + 13, safeY - 19, safeX + 25, safeY, safeX, safeY + 14);
        paint.setStyle(Paint.Style.FILL);
        paint.setColor(Color.rgb(237, 99, 134));
        canvas.drawPath(heart, paint);
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(3);
        paint.setColor(Color.WHITE);
        canvas.drawPath(heart, paint);
    }

    private static void drawAvatar(
            Canvas canvas,
            Paint paint,
            float x,
            float y,
            String name,
            int background,
            boolean longHair
    ) {
        float safeX = Math.max(38, Math.min(WIDTH - 38, x));
        float safeY = Math.max(42, Math.min(HEIGHT - 70, y));
        paint.setStyle(Paint.Style.FILL);
        paint.setColor(Color.WHITE);
        canvas.drawCircle(safeX, safeY, 34, paint);
        paint.setColor(background);
        canvas.drawCircle(safeX, safeY, 30, paint);

        paint.setColor(longHair ? Color.rgb(83, 54, 52) : Color.rgb(42, 46, 58));
        RectF hair = new RectF(safeX - 19, safeY - 22, safeX + 19, safeY + 18);
        canvas.drawOval(hair, paint);
        paint.setColor(Color.rgb(244, 193, 158));
        canvas.drawCircle(safeX, safeY - 2, 14, paint);
        if (!longHair) {
            paint.setColor(Color.rgb(42, 46, 58));
            canvas.drawArc(new RectF(safeX - 15, safeY - 17, safeX + 15, safeY + 4), 180, 180, true, paint);
        }

        paint.setColor(Color.rgb(56, 43, 50));
        paint.setTextAlign(Paint.Align.CENTER);
        paint.setTextSize(13);
        paint.setFakeBoldText(true);
        String label = name == null || name.isEmpty() ? "Partner" : name;
        canvas.drawText(label, safeX, safeY + 48, paint);
        paint.setFakeBoldText(false);
    }

    private static Bitmap loadTile(Context context, int zoom, int x, int y) {
        File directory = new File(context.getCacheDir(), "osm-widget-tiles");
        if (!directory.exists() && !directory.mkdirs()) return null;
        File cached = new File(directory, zoom + "_" + x + "_" + y + ".png");
        if (cached.isFile()
                && System.currentTimeMillis() - cached.lastModified() < MAX_TILE_AGE_MS) {
            Bitmap bitmap = BitmapFactory.decodeFile(cached.getAbsolutePath());
            if (bitmap != null) return bitmap;
        }

        HttpURLConnection connection = null;
        try {
            URL url = new URL(
                    "https://tile.openstreetmap.org/" + zoom + "/" + x + "/" + y + ".png"
            );
            connection = (HttpURLConnection) url.openConnection();
            connection.setConnectTimeout(6_000);
            connection.setReadTimeout(6_000);
            connection.setRequestProperty(
                    "User-Agent",
                    "DNest/1.2 (https://dnest-app.vercel.app)"
            );
            if (connection.getResponseCode() != 200) return null;
            Bitmap bitmap = BitmapFactory.decodeStream(connection.getInputStream());
            if (bitmap != null) {
                try (FileOutputStream output = new FileOutputStream(cached)) {
                    bitmap.compress(Bitmap.CompressFormat.PNG, 100, output);
                }
            }
            return bitmap;
        } catch (Exception ignored) {
            return cached.isFile()
                    ? BitmapFactory.decodeFile(cached.getAbsolutePath())
                    : null;
        } finally {
            if (connection != null) connection.disconnect();
        }
    }

    private static int zoomFor(Integer distanceKm) {
        if (distanceKm == null) return 10;
        if (distanceKm < 2) return 14;
        if (distanceKm < 10) return 12;
        if (distanceKm < 50) return 9;
        if (distanceKm < 200) return 7;
        if (distanceKm < 800) return 5;
        if (distanceKm < 3000) return 3;
        return 2;
    }

    private static double worldX(double longitude, int zoom) {
        return (longitude + 180.0) / 360.0 * TILE_SIZE * (1 << zoom);
    }

    private static double worldY(double latitude, int zoom) {
        double safeLatitude = Math.max(-85.0511, Math.min(85.0511, latitude));
        double radians = Math.toRadians(safeLatitude);
        double mercator = Math.log(Math.tan(radians) + 1.0 / Math.cos(radians));
        return (1.0 - mercator / Math.PI) / 2.0 * TILE_SIZE * (1 << zoom);
    }
}
