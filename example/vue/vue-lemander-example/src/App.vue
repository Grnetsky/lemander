<template>
  <Header></Header>
  <div class="editor">
    <Icons></Icons>
    <Meta2d></Meta2d>
  </div>

</template>

<script setup lang="js">
import Header from "../../../vue/vue-lemander-example/src/components/Header.vue";
import Icons from "../../../vue/vue-lemander-example/src/components/Icons.vue";
import Meta2d from "../../../vue/vue-lemander-example/src/components/Meta2d.vue";
</script>

<style>
:root {
  --list-width:212px
}
* {
  padding: 0;
  margin: 0;
  outline: none;
  box-sizing: border-box;
  word-break: break-all;
  word-break: break-word;
  list-style: none;
}

html, body, #app {
  width: 100%;
  height: 100%;
}
.editor{
  width: 100%;
  height: calc(100% - 61px);
  position: relative;
}
.nav {
  width: 100%;
  height: 61px;
  box-shadow: 2px 2px 4px 2px #e1e1e1;
  background-color: #f1f3f4;
  z-index:999;
  position: relative;
}
.nav ul {
  width: 100%;
  height: 100%;
  line-height: 61px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}
.nav li {
  margin: 10px;
  border-radius: 4px;
  cursor: pointer;
}
.aside {
  float: left;
  width:  var(--list-width);
  height: 100%;
  border-right: 1px solid #ccc;
  background-color: #f1f3f4;
  z-index: 888;
  position: relative;
}
.aside ul {
  width: 100%;
  position: relative;
  z-index:1;
}
#meta2d {
  margin-left: var(--list-width);
  position: relative;
  height: 100%;
}
.button {
  user-select: none;
}
.button:hover {
  background-color: #adadad;
}
.drag { cursor: move;
}

</style>


