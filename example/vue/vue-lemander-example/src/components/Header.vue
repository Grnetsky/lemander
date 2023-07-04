<script setup>
import { ref, onMounted, onUnmounted } from "vue";

onMounted(()=>{})
function newFile(e){
  window.meta2d.open()
}
async function openFile(){
    const file = await window.showOpenFilePicker().catch(()=>{
      console.log("打开文件失败")
      return
    })
    if(file){
      const dataObj = await file[0].getFile()
      const data = await dataObj.text()
      if(data){
        const json = JSON.parse(data);
        window.meta2d.open(json);
      }
    }
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
      <li class="button" @click="newFile">新建文件</li>
      <li class="button" @click="openFile">打开文件</li>
      <li class="button" @click="saveFile">保存</li>
      <li class="button" @click="magnifier">放大镜</li>
      <li class="button" @click="minimap">缩略图</li>
      <li class="button">其他</li>
    </ul>
  </div>
</template>

<style scoped>

</style>