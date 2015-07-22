package se.landsmann.sufusku;

import static spark.Spark.get;
import static spark.Spark.put;
import static spark.SparkBase.port;
import static spark.SparkBase.staticFileLocation;

public class Sufusku {

    private Matrix matrix = new Matrix();
    private Log log = new Log();

    public Sufusku() {

        String port = System.getenv("PORT");
        port(port == null ? 4567 : Integer.parseInt(port));

        staticFileLocation("/public");

        get("/reset", (request, response) -> {
            matrix.reset();
            return matrix.toJson();
        });

        get("/matrix", (request, response) ->
                        matrix.toJson()
        );

        put("/matrix", (request, response) -> {
            int row = Integer.valueOf(request.queryParams("row"));
            int col = Integer.valueOf(request.queryParams("col"));
            int value = Integer.valueOf(request.queryParams("value"));
            matrix.setCellValue(row, col, value);
            log.add(row, col, value, matrix);
            return matrix.toJson();
        });

        get("/log", (request, response) ->
                        log.toJson()
        );

        put("log", (request, response) -> {
            int logIndex = Integer.valueOf(request.queryParams("logIndex"));
            return log.getLogItem(logIndex).getMatrix().toJson();
        });
    }

    public static void main(String[] args) {
        new Sufusku();
    }
}
