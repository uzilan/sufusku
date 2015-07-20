package se.landsmann.sufusku;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

public class Log {

    private Map<Integer, LogItem> log = new HashMap<>();

    public void reset() {
        log.clear();
    }

    public void add(int row, int col, int value, Matrix matrix) {
        Coordinates coordinates = new Coordinates((char) ('a' + col - 1), row);
        LogItem logItem = new LogItem(matrix, coordinates, value);

        log.put(logItem.getIndex(), logItem);
    }

    public String toJson() {
        JSONArray rows = new JSONArray();

        log.entrySet().stream()
                .forEach(e -> {
                    JSONObject obj = new JSONObject();
                    obj.put("index", e.getKey());
                    obj.put("logItem", e.getValue().toJson());
                    rows.put(obj);
                });
        return rows.toString();
    }
}
