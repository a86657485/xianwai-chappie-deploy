# 本地部署

1. 将本部署包完整解压到一个文件夹，不要只提取 `index.html`。
2. 用已有静态服务器运行此文件夹；安装了Python的电脑也可在此文件夹运行：

   ```sh
   python3 -m http.server 4173 --bind 127.0.0.1
   ```

   Windows可将 `python3` 换为 `py`。若4173已在使用，请改用其他空闲端口，并在浏览器地址中使用相同端口。
3. 打开 `http://127.0.0.1:4173/`，先显示黑色发布会开场，扫描结束后点击“进入汇报”。

首页：`index.html`。跳转目标：`xianwai-chappie.html`（原页面内容完全保留）。

所有模型、校徽、材质和脚本均随包附带，无需联网下载。入口页需要通过HTTP打开，不能只双击HTML。推荐使用开启硬件加速的新版Chrome或Edge。操作系统开启减少动态效果时会跳过扫描；3D加载失败时仍可进入汇报。

检查了真实模型加载、扫描和按钮时序、跳转路径、资产完整性及原页面未变。无法直接访问使用者电脑上的127.0.0.1，尚未在使用者浏览器或投屏设备中验收。

模型与绑定：Beneth Borromeo，CC BY 4.0（按原站署名）；动画：Adobe Mixamo；Chappie角色 © Sony Pictures / MRC。
参考项目：Jorge Cuevas，MIT。相关许可见 `assets/ORIGINAL-LICENSE.txt`；完整来源在原汇报页面“来源”中。
