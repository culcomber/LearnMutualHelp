// signin 登录页
var express = require('express');
var router = express.Router();
// var request = require('request');
// var https = require('https');
// var scrypt = require('scrypt');
var UserModel = require('../models/users');
// var oAuth_github = require('../config/oAuth_github');

var checkNotLogin = require('../middlewares/check').checkNotLogin;
// var key = new Buffer('Rondo Blog'); // 用于 scrypt hash加密
const sha1 = require('sha1')

// xss简单字符转换防范
function encodeHTML(str){
  return String(str)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&qout")
    .replace(/'/g,"#39");
}

// GET /signin 登录页
router.get('/signin', checkNotLogin, function(req, res, next) {
    res.render('signin');
});

// POST /signin 用户登录
router.post('/signin', checkNotLogin, function(req, res, next) {

  var name = encodeHTML(req.fields.name);
  var password = req.fields.password;
    try {
      if (!name.length) {
        throw new Error('请填写用户名')
      }
      if (!password.length) {
        throw new Error('请填写密码')
      }
    } catch (e) {
      req.flash('error', e.message)
      return res.redirect('back')
    }

  UserModel.getUserByName(name)
  .then(function (user) {
    if (!user) {
      req.flash('error', '用户不存在');
      return res.redirect('back');
    }
    if (sha1(password) !== user.password) {
      req.flash('error', '用户名或密码错误')
      return res.redirect('back')
    }
    req.flash('success', '登录成功');
    // 用户信息写入 session
    delete user.password;
    req.session.user = user;
    // 跳转到主页
    return res.redirect('/posts');
  })
  .catch(next);
});

module.exports = router;
