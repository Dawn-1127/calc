本项目仅个人使用，修改了部分内容。
请大家使用源仓库吧
## Closure++

Originally known as Yet Another Toolbox for Arknights. Now with more games!

### Introduction

Closure++ is an open-source project aimed at providing a comprehensive toolbox for Arknights planning and progression calculations.

本仓库是 [orz-tools/cpp](https://github.com/orz-tools/cpp) 的个人维护分支。

### 与上游的差异

- 更新依赖版本，添加了若干测试（使用LLM)。
- 不再从服务器获取「明日方舟一图流」物品价值，改为内置物品价值文件；支持用户导入一图流JSON文件。
- 仅在gamedata更新后提示导入前更新数据。
- 将森空岛导入授权地址修改为vercel源站。
- 使用单位缩写尝试改善物品列表中大数字显示效果（如 196万 / 1.96M）。
- 过滤神秘温泉券。

### 对上游数据的依赖

以下远程数据沿用上游的数据服务：

- 游戏数据（干员、道具、关卡等）
- 练度统计
- 各种图片资源

### Features

- Game-specific toolsets: Closure++ offers a wide range of features tailored to specific games, including but not limited to Arknights. We strive to enhance the gaming experience by providing utilities, guides, and resources for various aspects of the supported games.

- Community-driven contributions: We encourage developers and non-developers to participate in the project. Whether it's submitting bug reports, suggesting new features, or contributing code, we value and appreciate every contribution. Together, we can make Closure++ a versatile and invaluable resource for gamers.

### Supported Games

Closure++ currently supports the following game:

- Arknights: A 2D tower defense mobile game developed and published by Hypergryph.

### Getting Started

```shell
$ yarn dev
```

### Contributions

Closure++ is an open-source project, and contributions are highly welcome. If you encounter any issues, have ideas for improvements, or would like to contribute in any way, please refer to the [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines on how to get involved.

### License

Closure++ is released under the [GNU AFFERO GENERAL PUBLIC LICENSE Version 3](LICENSE). Please refer to the LICENSE file for more details.

### Contact

If you have any questions, suggestions, or just want to connect with the Closure++ community, you can reach us through the following channels:

- [GitHub Issues](https://github.com/orz-tools/cpp/issues)
- [Email](mailto:cpp@ouomail.com)

Feel free to join the conversation and contribute to Closure++ in any way you can!
