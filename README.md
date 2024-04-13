# 基于VUE的斗地主游戏

> 基于官方脚手架搭建，主要开发的精力集中在游戏算法和逻辑的实现

> 目前实现了二人斗地主的游戏逻辑与界面交互

## 功能

- [x] 粗暴的界面布局
- [x] 游戏逻辑
- [x] 随机发牌
- [x] 智能出牌
- [x] 基于智能出牌实现自动牌局
- [x] 游戏结算
- [x] 游戏操作菜单（如“抢地主”、“出牌”、“不出”等操作）
- [x] 玩家自主选牌
- [x] TouchEvent和MouseEvent切换（兼容移动和PC操作）
- [ ] 游戏倒计时
- [ ] 特殊牌型动效

## 简介

1.这个项目主要目的学习和使用vue的一些特性，快速搭建游戏的可视化界面，方便调试和优化斗地主的智能选牌、出牌及游戏过程的相关算法。

2.项目的核心思路是用一个`GameServer`模块充当逻辑层来处理游戏数据与逻辑，然后通过`发布/订阅`模式或其它方法与游戏表现层进行数据交互。使逻辑层与表现层分离，这样就可以灵活的改变表现层的实现方案，既可以是canvas/webgl，也可以是dom。
在该项目中，我的方案是将游戏逻辑层处理好的数据注入到游戏主组件的data中，通过主组件向各个子组件进行分发，实现整个游戏的界面展示功能。

## 涉及vue技术点

- Class与Style绑定
- 条件渲染
- 列表渲染
- 模板语法（指令、filters、slot等等）
- 组件
- 父子组件、非父子组件间通信
- 自定义指令

## 二人斗地主游戏玩法简介

- 卡牌规定：从一副手牌中去掉所有的3和4，剩余46张牌进行游戏。
- 发牌阶段：给每位玩家17张牌，其中包含一张明牌（双方都能看见），获得明牌者先叫地主
- 叫/抢地主阶段： 与三人斗地主类似的流程，但每人可以抢2次地主，并且，每抢1次地主，农民方获1张让牌福利
- 打牌阶段： 出牌规则与三人斗地主一致
- 游戏结算： 地主必须全部出完牌方可获胜，农民方当手牌数小于等于让牌数时即可获胜

  *出牌规则*

  1. 单张
  2. 对子
  3. 三张
  4. 三带一、三带对
  5. 单顺、双顺、三顺
  6. 飞机（三顺+对应牌组数的单牌/对牌,如 5556667788）
  7. 四带二（可带2张单牌）
  8. 炸弹（4张）
  9. 王炸/火箭（双王）

  *出牌权重*
  1. 单张牌值大小： 5~k~A~2~小王~大王；单张牌不以花色区分大小，对方出5你必须出6
  2. A和2不能连为顺子
  3. 出牌数必须一致，比如对方出三带一，你也必须出三带一，不能出三带二压
  4. 四带二不是炸弹
  5. 王炸>炸弹>其他牌型


## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report
```

For detailed explanation on how things work, checkout the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader).
