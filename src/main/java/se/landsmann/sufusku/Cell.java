package se.landsmann.sufusku;

import java.io.Serializable;
import java.util.List;
import java.util.SortedSet;
import java.util.TreeSet;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

public class Cell implements Serializable {

    private int value;

    private int rowIndex;
    private int colIndex;
    private int groupIndex;
    private List<Cell> row;
    private List<Cell> col;
    private List<Cell> group;
    private SortedSet<Integer> numbers;
    private boolean isCrazy;

    public Cell(int rowIndex, int colIndex, int groupIndex) {
        this.rowIndex = rowIndex;
        this.colIndex = colIndex;
        this.groupIndex = groupIndex;

        reset();
    }

    public void reset() {
        value = 0;
        numbers = new TreeSet<>();
        IntStream.range(1, 10).forEach(numbers::add);
    }

    public int getValue() {
        return value;
    }

    public void setValue(int value) {
        if (value == 0 || this.value != 0) {
            if (!valueExists(row, this)) {
                row.forEach(r -> r.addNumber(this.value));
            }
            if (!valueExists(col, this)) {
                col.forEach(r -> r.addNumber(this.value));
            }
            if (!valueExists(group, this)) {
                group.forEach(r -> r.addNumber(this.value));
            }
        }
        row.forEach(r -> r.removeNumber(value));
        col.forEach(r -> r.removeNumber(value));
        group.forEach(r -> r.removeNumber(value));
        this.value = value;
    }

    private boolean valueExists(List<Cell> cells, Cell cell) {

        return cells.stream()
                .filter(c -> c != cell)
                .anyMatch(c -> c.getValue() == cell.value);
    }

    public List<Cell> getRow() {
        return row;
    }

    public void setRow(List<Cell> row) {
        this.row = row;
    }

    public List<Cell> getCol() {
        return col;
    }

    public void setCol(List<Cell> col) {
        this.col = col;
    }

    public List<Cell> getGroup() {
        return group;
    }

    public void setGroup(List<Cell> group) {
        this.group = group;
    }

    public String getNumbers() {
        return numbers.stream()
                .map(Object::toString)
                .collect(Collectors.joining());
    }

    private void removeNumber(int number) {
        numbers.removeIf(n -> n == number);
    }

    private void addNumber(int number) {
        numbers.add(number);
    }

    public boolean isCrazy() {
        return isCrazy;
    }

    public void setIsCrazy(boolean isCrazy) {
        this.isCrazy = isCrazy;
    }

    public int getRowIndex() {
        return rowIndex;
    }

    public int getColIndex() {
        return colIndex;
    }

    public int getGroupIndex() {
        return groupIndex;
    }
}
