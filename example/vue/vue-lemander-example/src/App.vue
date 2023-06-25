<template>
  <Header></Header>
  <Icons></Icons>
  <Meta2d></Meta2d>
</template>

<script setup lang="js">
import Header from "../../../vue/vue-lemander-example/src/components/Header.vue";
import Icons from "../../../vue/vue-lemander-example/src/components/Icons.vue";
import Meta2d from "../../../vue/vue-lemander-example/src/components/Meta2d.vue";
</script>

<style>
* {
  padding: 0;
  margin: 0;
  outline: none;
  box-sizing: border-box;
  word-break: break-all;
  word-break: break-word;
  list-style: none;
}

.nav {
  width: 100%;
  height: 61px;
  border: 1px black solid;

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

</style>
