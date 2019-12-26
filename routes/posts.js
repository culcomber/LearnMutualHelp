// version 1.0.0
var express = require('express');
var router = express.Router();
var PostModel = require('../models/posts');
var ProblemModel = require('../models/problems');
var Users = require('../models/users');
var CommentModel = require('../models/comments'); // 留言模块
var AnswerModel = require('../models/answers'); // 留言模块
var UserModel = require('../models/users');

// var scrypt = require('scrypt');
const sha1 = require('sha1')
var express = require('express');
var router = express.Router();
// var key = new Buffer('Rondo Blog'); // 用于 scrypt hash加密

// 权限检查
var checkLogin = require('../middlewares/check').checkLogin;

// xss简单字符转换防范
function encodeHTML(str){
  return String(str)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&qout")
    .replace(/'/g,"#39");
}

// 主页
router.get('/home', checkLogin, function(req, res, next) {
  var author = req.query.author;
  PostModel.getPosts(author).then(function (result) {
      var posts = result;
      ProblemModel.getProblems(author).then(function (result1) {
        var problems = result1;
        if(req.session.user){
          var authorCollected = req.session.user._id;
          PostModel.getCollections(authorCollected).then(function (result){
            var collections = result.collections　|| [];
             res.render('home', {
                posts: posts,      // 识别当前登录用户
                problems : problems,
                collections: collections
            });
          });
        }else{
             res.render('home',{
                posts: posts,
                problems : problems
            });
        }
    });
  });
});

// 文章页
router.get('/posts',function (req,res,next){
  // author 区分用户页和主页
  var author = req.query.author;
  PostModel.getPosts(author).then(function (result) {
      var posts = result;
      if(req.session.user){
        var authorCollected = req.session.user._id;
        PostModel.getCollections(authorCollected).then(function (result){
          var collections = result.collections　|| [];
           res.render('posts', {
              posts: posts,      // 识别当前登录用户
              collections: collections
          });
        });
      }else{
           res.render('posts',{
              posts: posts
          });
      }
  });
});

// 用户主页
router.get('/user',function (req,res,next){
  // author 区分用户页和主页
  var author = req.query.author;
  PostModel.getPosts(author).then(function (result) {
      var posts = result;
      ProblemModel.getProblems(author).then(function (result1) {
        var problems = result1;
        PostModel.getCollections(author).then(function (result){
          var collections = result.collections;
          PostModel.getCollect(collections).then(function (collections){
              var problemId = req.query.problemId,
              selects = [ProblemModel.getProblemById(problemId),// 获取问题信息
              AnswerModel.getAnswers(problemId),// 获取该问题所有留言
              ProblemModel.incPv(problemId)];
        
              if(req.session.user){
                  selects.slice(2,1,ProblemModel.getCollections(req.session.user._id));
              }
          
              Promise.all(selects).then(function (result) {
                  var answers = result[1]
                  res.render('personal',{
                      posts : posts,
                      problems : problems,
                      collections: collections,
                      answers : answers
                  });
              })
              .catch(next);
          });
        });
      });
  });
});

// 收藏文章
router.get('/collect',function (req,res,next){
      // 根据文章Id 识别当前收藏文章
      var author = req.query.author,
          post = req.query.post;

          PostModel.getCollections(author,post).then(function (result){

              return new Promise(function (resolve,reject){
                  var collections = result.collections,
                      flag = false;

                  for(var i in collections){
                    if(post === collections[i]){
                      flag = true;
                      break;
                    }
                  }
                  resolve(flag);
                });
          }).then(function (result){
            if(result){
              Users.adoptCollect(author,post);

              return new Promise(function (resolve,reject){
                 resolve(result);
              });
            }else{
              Users.addCollect(author,post);

              return new Promise(function (resolve,reject){
                 resolve(result);
              });
            }
          }).then(function (result){
             res.status(200).json(result);
             return res.end();
          });
});

// 文章点赞接口
router.get('/favourite',function (req,res,next){
  var user = req.query.user,
      post = req.query.post;

  PostModel.getPostById(post).then(function (result){
    var favourites = result.favourite,
        flag = false;

    if(favourites === null){
      flag = false;
    }else{
      for(var i=0;i < favourites.length; i++){
        if(user === favourites[i]){
          flag = true;
        }
      }
    }

    if(flag){
      PostModel.unfavourite(post,user).then(function (result){
        var count = -1;
        PostModel.favourite_count(post,count).then(function (result){
          var status = {
            "favourite": 'success',
            "count": count
          };

          return res.json(status);
        });
      });
    }else{
      PostModel.favourite(post,user).then(function (result){
        var count = 1;
        PostModel.favourite_count(post,count).then(function (result){
          var status = {
            "favourite": 'failed',
            "count": count
          };

          return res.json(status);
        });
      });
    }
  });
});

// GET /user/newArticle 发表文章页
router.get('/user/newArticle', checkLogin, function(req, res, next) {
  res.render('create');
});

// POST /posts 发表一篇文章
router.post('/create/submit', checkLogin, function(req, res, next) {
  // 基本信息
  var author = req.query.author;
  var title = req.fields.title;
  var content = encodeHTML(req.fields.content);
  var favourite = [];

  // 校验数据合法性
  try {
  if (!title.length) {
    throw new Error('请填写标题');
  }
  if (!content.length) {
    throw new Error('请填写内容');
  }
} catch (e) {
  req.flash('error', e.message);
  return res.redirect('back');
}

// blog _post实体 当前
var post = {
  author: author,
  title: title,
  content: content,
  pv: 0,
  favourite: favourite,
  favourite_count: 0
};

PostModel.create(post)
  .then(function (result) {
    // 此 post 是插入 mongodb 后的值，包含 _id
    post = result.ops[0];
    req.flash('success', '发表成功');
    // 发表成功后跳转到该文章页
    // 必须使用 ``，否则读取不成功
    return res.redirect(`/article?postId=${post._id}`);
  });
});

// GET /posts/:postId 单独一篇的文章页
router.get('/article', function(req, res, next) {
  var postId = req.query.postId,
      selects = [PostModel.getPostById(postId),// 获取文章信息
      CommentModel.getComments(postId),// 获取该文章所有留言
      PostModel.incPv(postId)];

  if(req.session.user){
     (2,1,PostModel.getCollections(req.session.user._id));
  }

  Promise.all(selects).then(function (result) {
        var post = result[0],
            comments = result[1],
            collections;

        if (!post) {
          throw new Error('该文章不存在');
        }

        if(result[2].collections){
          collections = result[2].collections;
        }else{
          collections = [];
        }

        res.render('post', {
          post: post,
          comments: comments,
          collections: collections
        });
      })
      .catch(next);
  });

// GET /posts/:postId/edit 编辑文章页
router.get('/article/edit', checkLogin, function(req, res, next) {
var postId = req.query.postId,
    author = req.session.user._id;

// 方法已定义
PostModel.getRawPostById(postId)
  .then(function (post) {
    if (!post) {
      throw new Error('该文章不存在');
    }
    if (author.toString() !== post.author._id.toString()) {
      throw new Error('权限不足');
    }
    res.render('edit', {
      post: post
    });
  })
  .catch(next);
});

// POST /posts/:postId/edit 更新一篇文章
router.post('/article/edit/finish', checkLogin, function(req, res, next) {
var postId = req.query.postId;
var author = req.session.user._id;
var title = req.fields.title;
var content = encodeHTML(req.fields.content);

PostModel.updatePostById(postId, author, { title: title, content: content })
.then(function () {
  req.flash('success', '编辑文章成功');
  // 编辑成功后跳转到上一页
  return res.redirect(`/article?postId=${postId}`); // 注意字符 ``
})
  .catch(next);
});

// GET /posts/:postId/remove 删除一篇文章
router.get('/article/remove', checkLogin, function(req, res, next) {
var postId = req.query.postId;
var author = req.session.user._id;

PostModel.delPostById(postId, author)
.then(function () {
  req.flash('success', '删除文章成功');
  // 删除成功后跳转到主页
  return res.redirect('/posts');
  })
  .catch(next);
});

// POST /posts/:postId/comment 创建一条留言
router.post('/article/addComment', checkLogin, function(req, res, next) {
  var author = req.session.user._id;
  var postId = req.query.postId;
  var content = encodeHTML(req.fields.content);
  var comment = {
      author: author,
      postId: postId,
      content: content
  };

  CommentModel.create(comment)
    .then(function () {
      req.flash('success', '留言成功');
      // 留言成功后跳转到上一页
      return res.redirect('back');
    })
    .catch(next);
});

// GET /posts/:postId/comment/:commentId/remove 删除一条留言
router.get('/article/rmComment', checkLogin, function(req, res, next) {
  var commentId = req.query.commentId;
  var author = req.session.user._id;

  CommentModel.delCommentById(commentId, author)
  .then(function () {
    req.flash('success', '删除留言成功');
    // 删除成功后跳转到上一页
    return res.redirect('back');
  })
  .catch(next);
});

// 问题页
router.get('/problems',function (req,res,next){
  // author 区分用户页和主页
  var author = req.query.author;

  ProblemModel.getProblems(author).then(function (result) {
      var problems = result;

      if(req.session.user){
        var authorCollected = req.session.user._id;

        ProblemModel.getCollections(authorCollected).then(function (result){
          var collections = result.collections　|| [];
           res.render('problems', {
              problems: problems,      // 识别当前登录用户
              collections: collections
          });
        });
      }else{
           res.render('problems',{
              problems: problems
          });
      }
  });
});

// GET /user/newProblem 提出问题页
router.get('/user/newProblem', checkLogin, function(req, res, next) {
res.render('createProblem');
});

// POST /problems 发表一篇问题
router.post('/createProblem/submit', checkLogin, function(req, res, next) {
// 基本信息
var author = req.query.author;
var title = req.fields.title;
var content = encodeHTML(req.fields.content);
var favourite = [];

// 校验数据合法性
try {
if (!title.length) {
  throw new Error('请填写标题');
}
if (!content.length) {
  throw new Error('请填写内容');
}
} catch (e) {
req.flash('error', e.message);
return res.redirect('back');
}

// blog _problem实体 当前
var problem = {
author: author,
title: title,
content: content,
pv: 0,
favourite: favourite,
favourite_count: 0
};

ProblemModel.create(problem)
.then(function (result) {
  // 此 problem 是插入 mongodb 后的值，包含 _id
  problem = result.ops[0];
  req.flash('success', '发表成功');
  // 发表成功后跳转到该问题页
  // 必须使用 ``，否则读取不成功
  return res.redirect(`/articleProblem?problemId=${problem._id}`);
});
});

// GET /problems/:problemId 单独一篇的问题页
router.get('/articleProblem', function(req, res, next) {
  var problemId = req.query.problemId,
      selects = [ProblemModel.getProblemById(problemId),// 获取问题信息
      AnswerModel.getAnswers(problemId),// 获取该问题所有留言
      ProblemModel.incPv(problemId)];

  if(req.session.user){
    selects.slice(2,1,ProblemModel.getCollections(req.session.user._id));
  }

  Promise.all(selects).then(function (result) {
        var problem = result[0],
            answers = result[1],
            collections;

        if (!problem) {
          throw new Error('该问题不存在');
        }

        if(result[2].collections){
          collections = result[2].collections;
        }else{
          collections = [];
        }

        res.render('problem', {
          problem: problem,
          answers: answers,
          collections: collections
        });
      })
      .catch(next);
  });

// GET /problems/:problemId/edit 编辑问题页
router.get('/articleProblem/edit', checkLogin, function(req, res, next) {
var problemId = req.query.problemId,
    author = req.session.user._id;

// 方法已定义
ProblemModel.getRawProblemById(problemId)
  .then(function (problem) {
    if (!problem) {
      throw new Error('该问题不存在');
    }
    if (author.toString() !== problem.author._id.toString()) {
      throw new Error('权限不足');
    }
    res.render('edit', {
      problem: problem
    });
  })
  .catch(next);
});

// POST /problems/:problemId/edit 更新一篇问题
router.post('/articleProblem/edit/finish', checkLogin, function(req, res, next) {
var problemId = req.query.problemId;
var author = req.session.user._id;
var title = req.fields.title;
var content = encodeHTML(req.fields.content);

ProblemModel.updateProblemById(problemId, author, { title: title, content: content })
.then(function () {
  req.flash('success', '编辑问题成功');
  // 编辑成功后跳转到上一页
  return res.redirect(`/articleProblem?problemId=${problemId}`); // 注意字符 ``
})
  .catch(next);
});

// GET /problems/:problemId/remove 删除一篇问题
router.get('/articleProblem/remove', checkLogin, function(req, res, next) {
var problemId = req.query.problemId;
var author = req.session.user._id;

ProblemModel.delProblemById(problemId, author)
.then(function () {
  req.flash('success', '删除问题成功');
  // 删除成功后跳转到主页
  return res.redirect('/problems');
  })
  .catch(next);
});

// POST /problems/:problemId/answer 创建一条回答
router.post('/articleProblem/addAnswer', checkLogin, function(req, res, next) {
  var author = req.session.user._id;
  var problemId = req.query.problemId;
  var content = encodeHTML(req.fields.content);
  var result = ProblemModel.getProblemById(problemId);
  var title = result.title;

  var answer = {
      author: author,
      problemId: problemId,
      content: content,
      title:title
  };

  AnswerModel.create(answer)
    .then(function () {
      req.flash('success', '回答成功');
      // 回答成功后跳转到上一页
      return res.redirect('back');
    })
    .catch(next);
});

// GET /problems/:problemId/answer/:answerId/remove 删除一条回答
router.get('/articleProblem/rmAnswer', checkLogin, function(req, res, next) {
  var answerId = req.query.answerId;
  var author = req.session.user._id;

  AnswerModel.delAnswerById(answerId, author)
  .then(function () {
    req.flash('success', '删除回答成功');
    // 删除成功后跳转到上一页
    return res.redirect('back');
  })
  .catch(next);
});

// GET myanswer
router.get('/answer',function (req,res,next){
  // author 区分用户页和主页
  var author = req.query.author;
  AnswerModel.getAnswersByAuthor(author).then(function (result) {
      var answers = result;
      res.render('answer', {
        answers: answers      // 识别当前登录用户
      });
  });
});

// 修改用户信息
router.post('/editPersonal', checkLogin, function(req, res, next) {
  
  var user_url = req.query.author;
  var bio = encodeHTML(req.fields.bio);

  UserModel.updatePostById(user_url, {bio: bio})
  .then(function () {
    req.flash('success', '修改成功');
    // 编辑成功后跳转到上一页
    return res.redirect('/personal'); // 注意字符 ``
  })
    .catch(next);
  });

router.get('/editPersonal', checkLogin, function(req, res, next) {
  res.render('editPersonal');
});
  

module.exports = router;
