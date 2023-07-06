<script setup>
import search from "./search.vue"
import listItem from "./listItem.vue"
import {data} from "@/assets/icons";
import {onMounted, ref} from "vue";
const icons = data
let searchData = ref("")
let isActive = ref(false)
function changeWidth(e){
  // document.querySelector(".l").style.left = e.x+"px"\
  if(isActive.value){
    document.documentElement.style.setProperty('--list-width',e.x-8+"px")
  }
}


</script>

<template>
<div class="aside">
  <search v-model="searchData"></search>
  <ul>
    <li>
      <listItem v-for="item in icons" :listData="item"></listItem>
    </li>
  </ul>
<!--  <div class="l" draggable="false"  @mousedown="isActive = true" @mouseup="isActive = false" @mousemove="changeWidth">-->
  <div class="l" draggable="false"  @mousedown="isActive = true" @mouseup="isActive = false" @mousemove="changeWidth">
  </div>
</div>
</template>

<style scoped>
.l {
  opacity: 0;
  width: 16px;
  height: 100%;
  background-color: rgba(0,0,0,.5);
  position: absolute;
  left: var(--list-width);
  top: 0;
  z-index: 999;
  user-select: none;
}
.l:hover {
  opacity: 1;
}
</style>