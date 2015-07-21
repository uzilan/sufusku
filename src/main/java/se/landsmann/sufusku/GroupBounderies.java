package se.landsmann.sufusku;

/**
 * Created by lanuz on 2015-07-21.
 */
public class GroupBounderies {
    int minX = 0;
    int maxX = 0;
    int minY = 0;
    int maxY = 0;

    static GroupBounderies getGroupBounderies(int row, int col) {

        GroupBounderies gb = new GroupBounderies();

        if (row >= 0 && row < 3) {
            gb.minX = 0;
            gb.maxX = 3;
        } else if (row >= 3 && row < 6) {
            gb.minX = 3;
            gb.maxX = 6;
        } else {
            gb.minX = 6;
            gb.maxX = 9;
        }

        if (col >= 0 && col < 3) {
            gb.minY = 0;
            gb.maxY = 3;
        } else if (col >= 3 && col < 6) {
            gb.minY = 3;
            gb.maxY = 6;
        } else {
            gb.minY = 6;
            gb.maxY = 9;
        }

        return gb;
    }
}
