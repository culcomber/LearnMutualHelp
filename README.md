# LearnMutualHelp

## 运行项目
```
git clone https://github.com/culcomber/LearnMutualHelp.git
npm i
node app
```

## 目录结构

遵循了 MVC（模型(model)－视图(view)－控制器(controller)） 的开发模式。

- controller: 路由跳转
- models: 文件夹里是一些Mongoose建立的Model文件
- node_modules:安装依赖
- public: 存放静态文件，如样式、图片等
- schemas: 文件夹里是一些Mongoose建立的Schema文件
- views: 存放模板文件
- config: 端口号,数据库配置信息
- app.js: 程序主文件
- package.json: 存储项目名、描述、作者、依赖等等信息
- .gitignore内写的是不需要上传到Git服务器的文件
- README.md是关于整个项目的说明。
- socket-event.js里定义了一个函数，用来处理socket.io的服务器端。
- web-router.js里写的是路由控制

## 安装依赖模块

对应模块的用处：
```
"body-parser": 解析post的请求取代了原生的 req.on 的方式 ,
"connect-flash": 页面通知的中间件，基于 session 实现,
"connect-mongo": 将 session 存储于 mongodb，结合 express-session 使用,
"ejs": 模板,
"ejs-mate": 模板,
"eventproxy": 基于事件机制对复杂的业务逻辑进行解耦的工具,
"express": web 框架,
"express-session": session 中间件,
"lodash": 一个一致性、模块化、高性能的 JavaScript 实用工具库,
"moment": 时间格式化,
"mongoose": mongodb 驱动,
"node-uuid": 生成唯一id，标识单个记录,
"qiniu": 七牛云上传图片,
"qn": 七牛云,
"request": 简单的 HTTP 客户端,
"socket.io": 实现在线聊天功能,
"underscore": 提供了一整套函数式编程的实用功能
```

## 功能及路由设计

```
// 主页
router.get('/', site.index);

// 用户相关
router.get('/user/home',user.home);// 个人中心
router.post('/register/api',user.register_api);//注册
router.post('/login/api',user.login_api);//登录
router.get('/logout',user.logout);//退出
router.post('/change-head-image/api',user.change_head_image_api);// 修改头像
router.post('/change-pwd/api',user.change_pwd_api);// 修改密码
router.post('/change-info/api',user.change_info_api);// 修改个人信息
router.post('/search-user/api',user.search_user_api);// 根据用户名查找用户
router.get('/mystar',checkLogin);// 我的收藏
router.get('/mystar',post.mystar);
router.get('/mypost',checkLogin);// 我的文章
router.get('/mypost',post.mypost);

// 模块相关
router.get('/group/:id',group.group_detail);// 模块详情
router.get('/discover',checkLogin);// 发现模块
router.get('/discover',group.discover);
router.post('/post-get-page/api',post.post_get_page_api);// 模块详情页帖子

// 文章相关
router.post('/post-add',checkLogin); // 发布文章
router.post('/post-add',post.post_add);
router.post('/post-add/api',post.post_add_api);// 发布文章api
router.post('/pic-add/api',post.pic_add_api);
router.post('/qn-upload',post.qn_upload);// 上传图片
router.get('/post/:id',checkLogin);// 查看文章
router.get('/post/:id',post.post_detail);
router.post('/post-delete/api',post.post_delete_api);// 删除文章api
router.post('/comment-add/api',post.comment_add_api);// 评论文章api
router.post('/comment-getall/api',post.comment_getall_api);// 获取文章所有评论api
router.post('/comment-delete/api',post.comment_delete_api);// 删除评论api
router.post('/star-add/api',post.star_add_api);// 收藏文章api
router.post('/star-delete/api',post.star_delete_api);// 取消收藏文章api

// 消息相关
router.get('/message',message.message);
router.post('/message-add/api',message.message_add_api);
router.post('/friend-add/api',message.friend_add_api);
router.post('/message-get/api',message.message_get_api);

// 404
router.get('*',site.error404);
```
