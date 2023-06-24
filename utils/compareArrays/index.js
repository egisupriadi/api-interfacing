module.exports = (array1, array2) => {
    const added = array2.filter((item) => !array1.includes(item));
    const removed = array1.filter((item) => !array2.includes(item));

    return {
        added,
        removed,
    };
}