// 回答模块
var marked = require('marked');
var Answer = require('../lib/mongo').Answer;

marked.setOptions({
  highlight: function (code) {
      return require('highlightjs').highlightAuto(code).value
  }
})

// 将 answer 的 content 从 markdown 转换成 html
Answer.plugin('contentToHtml', {
  afterFind: function (answers) {
    return answers.map(function (answer) {
      answer.content = marked(answer.content);
      console.log(answer.content)
      return answer;
    });
  }
});

module.exports = {
  // 创建一个回答
  create: function create(answer) {
    return Answer.create(answer).exec();
  },

  // 通过用户 id 和回答 id 删除一个回答
  delAnswerById: function delAnswerById(answerId, author) {
    return Answer.remove({ author: author, _id: answerId }).exec();
  },

  // 通过问题 id 删除该问题下所有回答
  delAnswersByProblemId: function delAnswersByProblemId(problemId) {
    return Answer.remove({ problemId: problemId }).exec();
  },

  // 通过问题 id 获取该问题下所有回答，按回答创建时间升序
  getAnswers: function getAnswers(problemId) {
    return Answer
      .find({ problemId: problemId })
      .populate({ path: 'author', model: 'User' })
      .sort({ _id: 1 })
      .addCreatedAt()
      .contentToHtml()
      .exec();
  },

  // 通过问题 id 获取该问题下回答数
  getAnswersCount: function getAnswersCount(problemId) {
    return Answer.count({ problemId: problemId }).exec();
  },

  // 通过 作者id 获取回答的问题id
  getAnswersByAuthor: function getAnswersByAuthor(author) {
    var query = {};
    if (author) {
      query.author = author;
    }
    return Answer
      .find(query)
      .populate({ path: 'author', model: 'User' })
      .addCreatedAt()
      .contentToHtml()
      .exec();
  }

};
