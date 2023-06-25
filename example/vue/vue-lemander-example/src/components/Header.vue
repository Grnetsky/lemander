<script setup>
import { ref, onMounted, onUnmounted } from "vue";

onMounted(()=>{})
function newFile(e){
}
function openFile(){

}
function saveFile(){

}
function magnifier(){

}
function minimap(){

}

</script>

<template>
  <div class="nav">
    <ul>
      <li @click="newFile">新建文件</li>
      <li @click="openFile">打开文件</li>
      <li @click="saveFile">保存</li>
      <li @click="magnifier">放大镜</li>
      <li @click="minimap">缩略图</li>
      <li>其他</li>
    </ul>
  </div>
</template>

<style scoped>

</style>