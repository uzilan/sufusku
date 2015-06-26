package se.landsmann.com;

import static spark.Spark.get;
import static spark.Spark.put;
import static spark.SparkBase.staticFileLocation;

public class Sufusku {

    private Matrix matrix = new Matrix();

    public Sufusku() {
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
            return matrix.toJson();
        });
    }

    public static void main(String[] args) {
        new Sufusku();
    }
}
