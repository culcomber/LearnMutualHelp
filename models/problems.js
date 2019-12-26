// 连接问题模型
var marked = require('marked'); //markdown 中间件，支持markdown语法
var Problem = require('../lib/mongo').Problem;
var Collects = require('../lib/mongo').Collects; // 问题收藏模块
var AnswerModel = require('./answers');

marked.setOptions({
  highlight: function (code) {
      return require('highlightjs').highlightAuto(code).value
  }
})

// 给 problem 添加回答数 answersCount
Problem.plugin('addAnswersCount', {
  afterFind: function (problems) {
    return Promise.all(problems.map(function (problem) {
      return AnswerModel.getAnswersCount(problem._id).then(function (answersCount) {
        problem.answersCount = answersCount;
        return problem;
      });
    }));
  },
  afterFindOne: function (problem) {
    if (problem) {
      return AnswerModel.getAnswersCount(problem._id).then(function (count) {
        problem.answersCount = count;
        return problem;
      });
    }
    return problem;
  }
});

// 将 problem 的主体 content 从 markdown形式转为 html
Problem.plugin('contentToHtml', {
  afterFind: function (problems) {
    return problems.map(function (problem) {
      problem.content = marked(problem.content);
      return problem;
    });
  },
  afterFindOne: function (problem) {
    if (problem) {
      problem.content = marked(problem.content);
    }
    return problem;
  }
});

module.exports = {
  // 创建一篇问题
  create: function create(problem) {
    return Problem.create(problem).exec();
  },

  // 通过问题 id 获取一篇问题
  getProblemById: function getProblemById(problemId) {
    return Problem
    .findOne({ _id: problemId })
    .populate({ path: 'author', model:'User' })
    .addCreatedAt()
    .addAnswersCount()
    .contentToHtml()
    .exec();
  },

  // 按创建时间降序获取所有用户问题或者某个特定用户的所有问题
  // 截取 URL 后的 user_Id 来进行区分
  getProblems: function getProblems(author) {
    var query = {};
    if (author) {
      query.author = author;
    }
    return Problem
      .find(query)
      .populate({ path: 'author', model: 'User' })
      .sort({ _id: -1 })
      .addCreatedAt()
      .addAnswersCount()
      .contentToHtml()
      .exec();
  },

  // 获取对应的收藏问题
  getCollect: function getCollect(collections){

     return Problem
     .find({_id: {$in: collections}})
     .populate({ path: 'author', model:'User'})
     .addCreatedAt()
     .addAnswersCount()
     .contentToHtml()
     .exec();
  },

  // 获取登录用户收藏问题
  getCollections: function getCollections(author){
      var collections = Collects
      .findOne({author: author},{collections: 1,_id: 0})
      .exec();
      return collections;
  },

  // 通过问题 id 给 pv 加 1
  incPv: function incPv(problemId) {
    return Problem
      .update({ _id: problemId }, { $inc: { pv: 1 } })
      .exec();
  },

  // 问题点赞
  favourite: function favourite(problem,user){
    return Problem.update({"_id": problem},{$addToSet:{"favourite":user}}).exec();
  },

  // 取消点赞
  unfavourite: function unfavourite(problem,user){
    return Problem.update({"_id": problem},{$pull:{"favourite":user}}).exec();
  },

  // 点赞总量+1
  favourite_count: function favourite_count(problem,number){
    if(number === 1){
      return Problem.update({"_id": problem},{$inc: {favourite_count: 1}}).exec();
    }else{
      return Problem.update({"_id": problem},{$inc: {favourite_count: -1}}).exec();
    }
  },

  // 点赞数量-1

  // 通过问题 id 获取一篇原生问题（编辑问题）
  getRawProblemById: function getRawProblemById(problemId) {
    return Problem
        .findOne({ _id: problemId })
        .populate({ path: 'author', model:'User'})
        .exec();
   },

   // 通过用户 id 和问题 id 更新一篇问题
   updateProblemById: function updateProblemById(problemId, author, data) {
     return Problem
     .update({ author: author, _id: problemId }, { $set: data })
     .exec();
   },

   // 通过用户 id 和问题 id 删除一篇问题
   delProblemById: function delProblemById(problemId, author) {
     return Problem
          .remove({ author: author, _id: problemId })
          .exec()
          .then(function (res) {
          // 问题删除后，再删除该问题下的所有回答
          if (res.result.ok && res.result.n > 0) {
            return AnswerModel.delAnswersByProblemId(problemId);
          }
        });
    },

    // 联合查询问题
    
};
