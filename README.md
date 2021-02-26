## 生成依赖

~~~bash
# 输出依赖
madge ./src/pages/pageA.js
# 生成图片
madge ./src/pages/pageA.js -i ./test.png
~~~

## 测试修改文件后影响的入口范围
~~~bash
# 安装依赖
yarn install

# 执行命令
yarn dev

# 如修改 ComponentB.js 预期结果
需要变更处理的入口文件 [
  '/Users/yourName/.../madge-change-demo/src/pages/pageB.js'
]
~~~