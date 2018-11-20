
module.exports.transListCategoryAuthor = transListCategoryAuthor;

function transListCategoryAuthor(list, categoryMap, authorMap) {
  const novelCategory = "novel_category";
  const novelAuthor = "novel_author";
  if (list.length) {
    list.forEach((item) => {
      item.categoryNames = item[novelCategory].split(",").map((id) => categoryMap[id])
      item.authorName = authorMap[item[novelAuthor]];
    })
  }
  return list;
}
