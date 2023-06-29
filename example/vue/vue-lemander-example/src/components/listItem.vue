<script setup lang="js">
import {onMounted, ref, watch} from "vue";
const status = ref(false)
import {parseSvg} from "svg"
defineProps(['listData'])
function dragStart(data,e){
  // 设置交互数据
  const json = JSON.stringify(data)
  e.dataTransfer.setData("meta2d",json)
}
// 解析svg为pens
fetch("/下一曲.svg").then((data)=>data.text()).then((text)=>{
  console.log(text)
  const pens = parseSvg(text)

})


</script>
<template>
  <div class="listItem">
    <div class="title button"  @click="status = !status">
      <i>></i>
      {{listData.title}}
    </div>
     <div class="list"  :style="{height:status?'max-content':'0',overflow:'hidden'}">
      <ul>
        <div class="list_item"  v-for="item in listData.data">
          <li v-if="item.key" draggable="true" @dragstart="dragStart(item.data,$event)" class="iconfont" :class="`icon-${item.key}`" :title="item.title"></li>
          <img
              v-else-if="item.svg"
              :src="item.svg"
              alt=""
              srcset=""
              class="img"
          />
        </div>
      </ul>
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
  .list ul {
    display: flex;
    justify-content: flex-start;
    align-content: center;
    flex-wrap: wrap;
  }
  .list_item {
    padding: 5px 10px
  }
  ul .list_item:hover {
    background-color: rgba(0,0,0,.2);
  }

</style>