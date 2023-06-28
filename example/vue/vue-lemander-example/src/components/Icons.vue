<script setup>
import search from "./search.vue"
import listItem from "./listItem.vue"
import {data} from "@/assets/icons";
import {onMounted, ref} from "vue";
const icons = data
let searchData = ref("")

</script>

<template>
<div class="aside">
  <search v-model="searchData"></search>
  <ul>
    <li>
      <listItem v-for="item in icons" :listData="item"></listItem>
    </li>
  </ul>
</div>
</template>

<style scoped>

</style>