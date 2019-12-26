# hello blog

## 目录结构

遵循了 MVC（模型(model)－视图(view)－控制器(controller/route)） 的开发模式。

- config: 端口号,数据库配置信息
- coverage: 测试结果存放
- lib: 数据库模型
- logs: 日志
- middlewares: 检测是否登陆
- models: 存放操作数据库的文件
- public: 存放静态文件，如样式、图片等
- routes: 存放路由文件
  - index 路由跳转
- test: 测试文件
- views: 存放模板文件
- index.js: 程序主文件
- package.json: 存储项目名、描述、作者、依赖等等信息
- .gitignore: 忽略相关文件 --需要在不同文件夹下同时建立
- .eslintrc.json: ESLint配置信息

## 安装依赖模块

```
- npm i config-lite connect-flash connect-mongo ejs express express-session marked moment mongolass objectid-to-timestamp sha1 winston express-winston express-formidable --save
```

对应模块的用处：

- //body-parser
- //cookie-parser：Express的中间件，用来实现cookie的解析，是官方脚手架内置的中间件之一
- //morgan
- //requirejs：application

- config-lite: 读取配置文件
- connect-flash: 页面通知的中间件，基于 session 实现
- connect-mongo: 将 session 存储于 mongodb，结合 express-session 使用
- jade：views渲染
- //ejs: 模板
- //cjs：collect
- //debug：collect 用于测试
- express: web 框架
- express-formidable: 接收表单及文件上传的中间件
- express-session: session 中间件
- express-winston: express 的 winston 日志中间件
- marked: markdown 解析
- moment: 时间格式化
- mongolass: mongodb 驱动
- objectid-to-timestamp: 根据 ObjectId 生成时间戳
- qiniu：七牛云上传图片
- sha1: sha1 加密，用于密码加密
- winston: 日志

### ESLint

```
#全局安装 eslint：
npm i eslint -g
#运行：
eslint --init
#初始化 eslint 配置，依次选择：
-> Use a popular style guide
-> Standard
-> JSON

注意：如果 Windows 用户使用其他命令行工具无法上下切换选项，切换回 cmd。
```

eslint 会创建一个 .eslintrc.json 的配置文件，同时自动安装并添加相关的模块到 devDependencies。这里我们使用 Standard 规范，其主要特点是不加分号。

## 功能及路由设计

1.注册
    - 注册页：GET /signup
    - 注册（包含上传头像）：POST /signup
2.登录
    - 登录页：GET /signin
    - 登录：POST /signin
3.登出：GET /signout
4.查看文章
    - 主页：GET /posts
    - 个人主页：GET /posts?author=xxx
    - 查看一篇文章（包含留言）：GET /posts/:postId
5.发表文章
    - 发表文章页：GET /posts/create
    - 发表文章：POST /posts/create
6.修改文章
    - 修改文章页：GET /posts/:postId/edit
    - 修改文章：POST /posts/:postId/edit
7.删除文章：GET /posts/:postId/remove
8.留言
    - 创建留言：POST /comments
    - 删除留言：GET /comments/:commentId/remove
