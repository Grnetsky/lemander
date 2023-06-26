<script setup lang="js">
import {onMounted, ref, watch} from "vue";
const status = ref(false)
defineProps(['listData'])
function dragStart(data,e){
  // 设置交互数据
  const json = JSON.stringify(data)
  e.dataTransfer.setData("meta2d",json)

}

</script>
<template>
  <div class="listItem">
    <div class="title button"  @click="status = !status">
      <i>></i>
      {{listData.title}}
    </div>
    <div class="list"  :style="{height:status?'max-content':'0',overflow:'hidden'}">
      <li v-for="item in listData.data" draggable="true" @dragstart="dragStart(item.data,$event)">{{item.title}}</li>
    </div>
  </div>
</template>

<style scoped>
  .listItem{
    width: 100%;
    height: auto;
    cursor: pointer;
  }
  .title{
    border-bottom: 1px solid #e5e5e5;
    height: 40px;
    display: flex;
    justify-content: flex-start;
    align-items: center;

  }

</style>