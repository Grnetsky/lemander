<script setup>
import { ref, onMounted, onUnmounted } from "vue";

onMounted(()=>{})
function newFile(e){
}
function openFile(){

}
function saveFile(){
  const jsonData =  window.meta2d.data() // 获取数据 数据怎么来？怎么处理？
  const json = JSON.stringify(jsonData)
  const  file = new Blob([json],{type:"application/json"})
  const link = URL.createObjectURL(file)
  let a = document.createElement('a')
  a.setAttribute("download","文件名")
  a.setAttribute("href",link)
  a.click()
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