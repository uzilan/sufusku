package se.landsmann.sufusku;

import java.util.List;
import java.util.SortedSet;
import java.util.TreeSet;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

public class Cell {

    private int value;
    private List<Cell> row;
    private List<Cell> col;
    private List<Cell> group;
    private SortedSet<Integer> numbers;

    public Cell() {
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
        if (this.value != 0) {
            row.forEach(r -> r.addNumber(this.value));
            col.forEach(r -> r.addNumber(this.value));
            group.forEach(r -> r.addNumber(this.value));
        }
        row.forEach(r -> r.removeNumber(value));
        col.forEach(r -> r.removeNumber(value));
        group.forEach(r -> r.removeNumber(value));
        this.value = value;
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
}
