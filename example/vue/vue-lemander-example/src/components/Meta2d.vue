<script setup lang="js">
import {onMounted} from "vue";
import {Meta2d} from "../../../../../core/src/core"
onMounted(()=>{
  console.log("meta2d mounted")
const meta2d = new Meta2d("meta2d") // 创建Meta2d对象

})

</script>

<template>
<div id="meta2d"></div>
</template>

<style scoped>

</style>