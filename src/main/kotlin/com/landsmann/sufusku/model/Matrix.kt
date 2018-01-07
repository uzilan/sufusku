package com.landsmann.sufusku.model

data class Matrix(val data: MutableList<Int> = createEmptyMatrix()) {
    val rows = (0 until 9).map { Group(data.subList(9 * it, 9 * (it + 1))) }
    val cols = (0 until 9).map { x -> Group(data.filterIndexed { y, _ -> y % 9 == x }.toMutableList()) }
    var groups = (0 until 9).map { Group(emptyList<Int>().toMutableList()) }

    init {
        (0 until 9).forEach { x ->
            (0 until 9).forEach { y ->
                val group = groups[getGroupIndex(x, y)]
                group.data.add(getAt(x, y))
            }
        }
    }

    private fun getAt(row: Int, col: Int): Int = data[row * 9 + col]

    override fun toString(): String {
        var s = ""
        data.forEachIndexed { index, cell ->
            if (index % 9 == 0) s += "\n"
            s += "$cell "
        }
        return s
    }
}

private fun createEmptyMatrix() = (0 until 81).map { 0 }.toMutableList()

private fun getLowest(index: Int): Int {
    return when {
        index in 0 until 3 -> 0
        index in 3 until 6 -> 3
        else -> 6
    }
}

private fun getGroupIndex(row: Int, col: Int): Int {
    val minX = getLowest(row)
    val minY = getLowest(col)

    return when (minX) {
        0 -> when (minY) {
            0 -> 0
            3 -> 1
            else -> 2
        }
        3 -> when (minY) {
            0 -> 3
            3 -> 4
            else -> 5
        }
        else -> when (minY) {
            0 -> 6
            3 -> 7
            else -> 8
        }
    }
}